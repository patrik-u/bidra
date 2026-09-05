import { readdir, readFile, access } from 'node:fs/promises'
import assert from 'node:assert/strict'

const assets = await readdir(new URL('../dist/client/assets/', import.meta.url))
// MapLibre 6 needs an explicitly bundled worker. A missing worker leaves an empty map.
const worker = assets.find(name => /^maplibre-gl-worker-.+\.js$/.test(name))
assert.ok(worker, 'MapLibre worker is missing from the public build.')
const workerCode = await readFile(new URL(`../dist/client/assets/${worker}`, import.meta.url), 'utf8')
assert.ok(workerCode.length > 10000, 'MapLibre worker bundle is unexpectedly empty.')
assert.ok(!workerCode.includes('./maplibre-gl-shared.mjs'), 'Worker references an unbundled sibling file.')
await access(new URL('../dist/client/index.html', import.meta.url))
await access(new URL('../dist/client/admin/index.html', import.meta.url))
console.log('Public HTML and self-contained MapLibre worker verified.')
