import { initiatives } from '../src/data/initiatives'
import type { Initiative } from '../src/data/initiatives'

type Row = { id: string; draft_json: string; published_json: string | null; status: string; revision: number }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
class Problem extends Error { constructor(public status: number, message: string) { super(message) } }
function fail(message: string, status = 400): never { throw new Problem(status, message) }
function validate(value: unknown, id: string): Initiative {
  if (!value || typeof value !== 'object') return fail('Initiativ saknas.')
  const v = value as Record<string, unknown>
  const field = (key: string, max = 2000) => {
    if (typeof v[key] !== 'string' || !(v[key] as string).trim() || (v[key] as string).length > max) return fail(`Kontrollera fältet ${key}.`)
    return (v[key] as string).trim()
  }
  const url = (key: string) => { const s = field(key, 2000); try { const u = new URL(s); if (u.protocol === 'https:' && !u.username && !u.password) return u.href } catch {} return fail('Länkar måste vara fullständiga https-adresser.') }
  if (!['natur', 'manniskor', 'djur', 'klimat', 'hav', 'barn'].includes(String(v.category))) fail('Välj en kategori.')
  if (v.scope !== 'local' && v.scope !== 'national') fail('Välj lokal eller nationell verksamhet.')
  if (!Array.isArray(v.giving) || !v.giving.length || v.giving.length > 2 || v.giving.some(x => !['pengar', 'tid'].includes(x))) fail('Välj minst ett sätt att bidra.')
  if (!Array.isArray(v.keywords) || v.keywords.length > 40 || v.keywords.some(x => typeof x !== 'string' || x.length > 80)) fail('Kontrollera sökorden.')
  const result: Initiative = { id, title: field('title', 160), organization: field('organization', 160), category: v.category as Initiative['category'], region: field('region', 160), scope: v.scope as Initiative['scope'], geography: field('geography'), summary: field('summary', 600), contribution: field('contribution'), source: url('source'), donate: url('donate'), keywords: v.keywords as string[], giving: v.giving as Initiative['giving'] }
  if (v.scope === 'local') {
    if (!Array.isArray(v.coordinates) || v.coordinates.length !== 2 || v.coordinates.some(x => typeof x !== 'number' || !Number.isFinite(x)) || Math.abs(v.coordinates[0]) > 180 || Math.abs(v.coordinates[1]) > 85) fail('Ange giltig longitud och latitud för kartan.')
    result.coordinates = v.coordinates as [number, number]
  }
  if (v.image) { if (typeof v.image !== 'string' || !/^\/images\/[a-z0-9-]+\.(jpg|png|webp)$/.test(v.image)) fail('Välj en av sajtens bilder.'); result.image = v.image as string }
  return result
}
async function seed(db: D1Database) {
  if (await db.prepare("SELECT value FROM registry_meta WHERE key = 'seed-v1'").first()) return
  const now = new Date().toISOString()
  const statements = initiatives.map(item => db.prepare("INSERT OR IGNORE INTO registry_entries (id,draft_json,published_json,status,revision,updated_at) VALUES (?,?,?,'published',1,?)").bind(item.id, JSON.stringify(item), JSON.stringify(item), now))
  statements.push(db.prepare("INSERT OR IGNORE INTO registry_meta (key,value) VALUES ('seed-v1',?)").bind(now))
  await db.batch(statements)
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname
    if (!path.startsWith('/api/')) return env.ASSETS.fetch(request)
    try {
      const actor = request.headers.get('oai-authenticated-user-id')
      const email = request.headers.get('oai-authenticated-user-email')
      const admin = Boolean(actor && email && env.ADMIN_EMAIL && email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase())
      if (path === '/api/session' && request.method === 'GET') return json({ admin, authenticated: Boolean(actor) })
      const publicRead = path === '/api/initiatives' && request.method === 'GET'
      if (!publicRead && !admin) return json({ error: actor ? 'Du saknar redaktörsbehörighet.' : 'Logga in för att redigera.' }, actor ? 403 : 401)
      if (request.method !== 'GET') {
        const origin = request.headers.get('origin')
        if (!origin || origin !== new URL(request.url).origin) fail('Begäran måste komma från Bidra.', 403)
        if (!request.headers.get('content-type')?.startsWith('application/json')) fail('JSON krävs.', 415)
      }
      await seed(env.DB)
      if (publicRead) { const rows = await env.DB.prepare('SELECT published_json FROM registry_entries WHERE published_json IS NOT NULL ORDER BY rowid').all<{ published_json: string }>(); return json({ initiatives: rows.results.map(row => JSON.parse(row.published_json)) }) }
      if (path === '/api/admin/entries' && request.method === 'GET') {
        const rows = await env.DB.prepare('SELECT * FROM registry_entries ORDER BY updated_at DESC').all<Row>()
        return json({ entries: rows.results.map(row => ({ id: row.id, draft: JSON.parse(row.draft_json), status: row.status, revision: row.revision, isPublic: Boolean(row.published_json) })) })
      }
      const match = path.match(/^\/api\/admin\/entries\/([a-z0-9-]{1,80})$/)
      if (match && request.method === 'GET') { const history = await env.DB.prepare('SELECT revision,action,note,created_at FROM registry_events WHERE entry_id = ? ORDER BY revision DESC LIMIT 50').bind(match[1]).all(); return json({ history: history.results }) }
      if (request.method !== 'POST' || (!match && path !== '/api/admin/entries')) return json({ error: 'Sidan finns inte.' }, 404)
      const reader = request.body?.getReader()
      if (!reader) fail('Innehåll saknas.')
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        size += chunk.value.byteLength
        if (size > 32000) { await reader.cancel(); fail('För mycket text.', 413) }
        chunks.push(chunk.value)
      }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
      const raw = new TextDecoder().decode(bytes)
      let body: Record<string, unknown>; try { body = JSON.parse(raw) } catch { return fail('Ogiltig JSON.') }
      if (!body || typeof body !== 'object') fail('Ogiltigt innehåll.')
      const now = new Date().toISOString(), mutation = crypto.randomUUID()
      if (!match) {
        const id = crypto.randomUUID(), draft = JSON.stringify(validate(body.draft, id))
        await env.DB.batch([
          env.DB.prepare("INSERT INTO registry_entries (id,draft_json,status,revision,updated_at,mutation_id) VALUES (?,?,'draft',1,?,?)").bind(id, draft, now, mutation),
          env.DB.prepare("INSERT INTO registry_events (id,entry_id,revision,action,actor,note,snapshot_json,created_at) VALUES (?,?,1,'create',?,'',?,?)").bind(mutation, id, actor, draft, now),
        ])
        return json({ id }, 201)
      }
      const row = await env.DB.prepare('SELECT * FROM registry_entries WHERE id = ?').bind(match[1]).first<Row>()
      if (!row) fail('Initiativet finns inte.', 404)
      if (!Number.isInteger(body.revision) || body.revision !== row.revision) fail('Initiativet har ändrats. Läs in den senaste versionen innan du försöker igen.', 409)
      const action = body.action
      let draft = row.draft_json, published = row.published_json, status = row.status
      const note = typeof body.note === 'string' ? body.note.trim() : ''
      if (note.length > 2000) fail('Anteckningen är för lång.')
      if (action === 'save') { draft = JSON.stringify(validate(body.draft, row.id)); status = 'draft' }
      else if (action === 'submit') { validate(JSON.parse(draft), row.id); if (status !== 'draft') fail('Spara ett utkast först.'); status = 'pending' }
      else if (action === 'approve') {
        if (status !== 'pending') fail('Skicka utkastet till granskning först.')
        const checks = body.checks as Record<string, unknown> | undefined
        if (!checks || ['identity', 'source', 'geography', 'donation'].some(key => checks[key] !== true) || note.length < 15) fail('Bekräfta alla kontrollpunkter och beskriv vad du har kontrollerat.')
        const date = body.sourceReadAt
        if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date > now.slice(0,10)) fail('Ange ett giltigt datum när källan lästes.')
        draft = JSON.stringify({ ...validate(JSON.parse(draft), row.id), sourceReadAt: date }); published = draft; status = 'published'
      } else if (action === 'return') { if (status !== 'pending' || note.length < 5) fail('Ange varför utkastet behöver ändras.'); status = 'draft' }
      else if (action === 'archive') { if (note.length < 5) fail('Ange varför initiativet arkiveras.'); published = null; status = 'archived' }
      else fail('Okänd åtgärd.')
      const result = await env.DB.batch([
        env.DB.prepare('UPDATE registry_entries SET draft_json=?,published_json=?,status=?,revision=revision+1,updated_at=?,mutation_id=? WHERE id=? AND revision=?').bind(draft, published, status, now, mutation, row.id, row.revision),
        env.DB.prepare('INSERT INTO registry_events (id,entry_id,revision,action,actor,note,snapshot_json,created_at) SELECT ?,id,revision,?,?,?,draft_json,? FROM registry_entries WHERE id=? AND mutation_id=?').bind(mutation, action, actor, note, now, row.id, mutation),
      ])
      if (!result[0].meta.changes) fail('En annan ändring hann före. Läs in senaste versionen.', 409)
      return json({ ok: true, revision: row.revision + 1 })
    } catch (error) {
      if (error instanceof Problem) return json({ error: error.message }, error.status)
      console.error('Registry request failed', error instanceof Error ? error.name : 'UnknownError')
      return json({ error: 'Registret kunde inte nås. Försök igen om en stund.' }, 503)
    }
  },
}
