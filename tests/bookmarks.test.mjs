import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/lib/vibe.ts'], bundle: true, write: false, format: 'esm', platform: 'browser', define: { 'import.meta.env': '{}' } })
const { changeSaved, savedIds } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('a concurrent bookmark addition survives a retry of a removal', async () => {
  let ids = ['forest', 'sea'], version = 1, writes = 0
  const client = { resume: async () => true, connect: async () => ({}), authorizedFetch: async (_url, _token, init) => {
    if (init.method !== 'PUT') return Response.json({ found: true, value: ids, version })
    writes++
    if (writes === 1) { ids = [...ids, 'animals']; version++; return Response.json({}, { status: 409 }) }
    assert.equal(init.headers['if-match'], '"2"')
    ids = JSON.parse(init.body).value
    return Response.json({ version: ++version })
  } }
  assert.deepEqual(await changeSaved(client, ids => ids.filter(id => id !== 'forest')), ['sea', 'animals'])
  assert.equal(writes, 2)
})

test('expired consent never writes or initiates popup authorization', async () => {
  const client = { resume: async () => false, connect: () => assert.fail('Must not initiate authorization') }
  await assert.rejects(changeSaved(client, () => ['forest']), /Logga in igen/)
})

test('malformed or excessive lists are rejected without clearing their stored value', () => {
  assert.throws(() => savedIds({ ids: [] }))
  assert.throws(() => savedIds(['ok', 42]))
  assert.throws(() => savedIds(Array(1001).fill('forest')))
  assert.deepEqual(savedIds(['forest', 'forest']), ['forest'])
})
