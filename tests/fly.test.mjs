import test from 'node:test'
import { get } from 'node:http'
import assert from 'node:assert/strict'
process.env.NODE_ENV = 'test'
const { catalog, server } = await import('../server/fly.mjs')

test('catalog follows Cloud pages and preserves entity IDs for bookmarks', async () => {
  const offsets = []
  const result = await catalog(async url => {
    if(url.searchParams.get('templateId')==='bidrakartan.organization.v1')return Response.json({documents:[],hasMore:false})
    const offset = Number(url.searchParams.get('offset')); offsets.push(offset)
    return Response.json({ documents: [{ entityId: `id-${offset}`, templateId: 'vibe.initiative.v1', payload: { category: 'natur', title: 'Skog' } }], hasMore: offset === 0 })
  })
  assert.deepEqual(offsets, [0,50])
  assert.deepEqual(result.initiatives.map(item => item.id), ['id-0','id-50'])
  await assert.rejects(catalog(async () => new Response('', { status: 503 })))
})

test('Fly routing supports callback, editor, errors and www redirect without trusting injected identity', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    for (const path of ['/', '/vibe-callback/', '/cloud-content']) assert.equal((await fetch(base + path)).status, 200)
    const session = await fetch(base + '/api/session', { headers: { 'oai-authenticated-user-id': 'attacker', 'oai-authenticated-user-email': 'owner@example.test' } })
    assert.equal((await session.json()).admin, false)
    assert.equal((await fetch(base + '/api/admin/entries')).status, 404)
    assert.equal((await fetch(base + '/.env')).status, 404)
    assert.equal((await fetch(base + '/%2e%2e%2fpackage.json')).status, 404)
    const www = await new Promise(resolve => get(base + '/?q=test', { headers: { host: 'www.bidrakartan.se' } }, response => { response.resume(); resolve(response) }))
    assert.equal(www.headers.location, 'https://bidrakartan.se/?q=test')
  } finally { await new Promise(resolve => server.close(resolve)) }
})
