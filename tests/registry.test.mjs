import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { Miniflare } from 'miniflare'

test('registry authorization, review, isolated drafts, conflicts and archive', async () => {
  const mf = new Miniflare({ modules: true, scriptPath: 'dist/server/index.js', compatibilityDate: '2026-08-01', d1Databases: ['DB'], bindings: { ADMIN_EMAIL: 'editor@example.invalid' } })
  try {
    const db = await mf.getD1Database('DB')
    for (const file of (await readdir('drizzle')).filter(name => name.endsWith('.sql')).sort()) {
      const sql = await readFile(`drizzle/${file}`, 'utf8')
      for (const statement of sql.split('--> statement-breakpoint').map(x => x.trim()).filter(Boolean)) await db.prepare(statement).run()
    }
    const owner = { 'oai-authenticated-user-id': 'test-owner', 'oai-authenticated-user-email': 'editor@example.invalid' }
    const call = async (path, body, headers = owner) => {
      const response = await mf.dispatchFetch(`https://bidra.test/api/${path}`, { headers: { ...headers, ...(body ? { origin: 'https://bidra.test', 'content-type': 'application/json' } : {}) }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) })
      return { status: response.status, body: await response.json() }
    }
    assert.equal((await call('admin/entries', null, {})).status, 401)
    assert.equal((await call('admin/entries', null, { ...owner, 'oai-authenticated-user-email': 'other@example.invalid' })).status, 403)
    const seed = (await call('initiatives', null, {})).body.initiatives
    assert.equal(seed.length, 8)
    assert.equal((await call('initiatives')).body.initiatives.length, 8)
    const item = seed[0], path = `admin/entries/${item.id}`
    assert.equal((await call(path, { action: 'archive', revision: 1, note: 'Obehörig ändring' }, {})).status, 401)
    assert.equal((await call(path, { action: 'save', note: 'x'.repeat(33000) })).status, 413)
    let revision = 1
    const changed = { ...item, title: 'Ett ändrat initiativ' }
    assert.equal((await call(path, { action: 'save', revision, draft: { ...changed, donate: 'javascript:alert(1)' } })).status, 400)
    assert.equal((await call(path, { action: 'save', revision, draft: { ...changed, coordinates: [200, 90] } })).status, 400)
    const badOrigin = await mf.dispatchFetch(`https://bidra.test/api/${path}`, { method: 'POST', headers: { ...owner, origin: 'https://other.test', 'content-type': 'application/json' }, body: JSON.stringify({ action: 'archive', revision, note: 'Not allowed' }) })
    assert.equal(badOrigin.status, 403)
    assert.equal((await call(path, { action: 'save', revision, draft: changed })).status, 200); revision++
    assert.equal((await call('initiatives')).body.initiatives.find(x => x.id === item.id).title, item.title)
    assert.equal((await call(path, { action: 'save', revision: 1, draft: changed })).status, 409)
    assert.equal((await call(path, { action: 'approve', revision })).status, 400)
    assert.equal((await call(path, { action: 'submit', revision })).status, 200); revision++
    assert.equal((await call(path, { action: 'approve', revision })).status, 400)
    const approval = { action: 'approve', revision, sourceReadAt: '2026-09-05', checks: { identity: true, source: true, geography: true, donation: true }, note: 'Källor och geografisk beskrivning kontrollerade i test.' }
    assert.equal((await call(path, { ...approval, sourceReadAt: '2026-02-31' })).status, 400)
    assert.equal((await call(path, approval)).status, 200); revision++
    assert.equal((await call('initiatives')).body.initiatives.find(x => x.id === item.id).title, changed.title)
    assert.equal((await call('initiatives')).body.initiatives.find(x => x.id === item.id).sourceReadAt, '2026-09-05')
    const race = await Promise.all([call(path, { action: 'save', revision, draft: { ...changed, title: 'A' } }), call(path, { action: 'save', revision, draft: { ...changed, title: 'B' } })])
    assert.deepEqual(race.map(x => x.status).sort(), [200, 409]); revision++
    assert.equal((await call(path)).body.history.length, 4)
    assert.equal((await call(path, { action: 'archive', revision, note: 'Arkivering i integrationstest.' })).status, 200); revision++
    assert.equal((await call('initiatives')).body.initiatives.length, 7)
    assert.equal((await call(path, { action: 'save', revision, draft: changed })).status, 200); revision++
    assert.equal((await call('initiatives')).body.initiatives.length, 7)
    assert.equal((await call('admin/entries', { draft: { ...item, title: 'Ny post' } })).status, 201)
    assert.equal((await call('initiatives')).body.initiatives.length, 7)
    const history = (await call(path)).body.history
    assert.equal(history.length, 6)
    assert.equal(new Set(history.map(x => x.revision)).size, history.length)
    // Failed event insertion must roll back the preceding update in the same batch.
    const before = await db.prepare('SELECT revision FROM registry_entries WHERE id=?').bind(item.id).first()
    await assert.rejects(db.batch([db.prepare('UPDATE registry_entries SET revision=revision+1 WHERE id=?').bind(item.id), db.prepare('INSERT INTO registry_events(id) VALUES (?)').bind('invalid')]))
    assert.deepEqual(await db.prepare('SELECT revision FROM registry_entries WHERE id=?').bind(item.id).first(), before)
  } finally { await mf.dispose() }
})
