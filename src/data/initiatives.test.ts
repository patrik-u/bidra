import assert from 'node:assert/strict'
import test from 'node:test'
import { initiatives, searchInitiatives } from './initiatives.ts'

test('Swedish free text finds the matching cause without generic donor words', () => {
  const results = searchInitiatives('Jag vill hjälpa barn i Sverige')
  assert.ok(results.some(item => item.id === 'bris'))
  assert.ok(!results.some(item => item.id === 'djupsjoan'))
})
test('Place search handles Swedish diacritics and capitalization', () => {
  assert.deepEqual(searchInitiatives('SKELLEFTEA').map(i => i.id), ['djurskyddet'])
  assert.deepEqual(searchInitiatives('Jämtland').map(i => i.id), ['djupsjoan'])
})
test('Unrecognized requests return an honest empty result', () => {
  assert.deepEqual(searchInitiatives('malariavaccin'), [])
})
test('A place and cause do not match unrelated local projects', () => {
  assert.deepEqual(searchInitiatives('hjälpa djur i Stockholm'), [])
  assert.deepEqual(searchInitiatives('djur i Skellefteå').map(i => i.id), ['djurskyddet'])
  assert.ok(searchInitiatives('barn i Göteborg').some(i => i.id === 'bris'))
})
test('Cause, contribution and locality filters combine', () => {
  assert.deepEqual(searchInitiatives('', 'hav', 'tid').map(i => i.id), ['skraphjaltar'])
  assert.deepEqual(searchInitiatives('', 'hav', 'pengar'), [])
  assert.deepEqual(searchInitiatives('', 'hav', 'tid', true), [])
  assert.ok(searchInitiatives('', 'all', 'all', true).every(i => i.scope === 'local'))
})
test('Nationwide initiatives do not get misleading headquarters pins', () => {
  assert.ok(initiatives.filter(i => i.scope === 'national').every(i => !i.coordinates))
  assert.ok(initiatives.filter(i => i.scope === 'local').every(i => i.coordinates && i.geography))
})
test('Records have unique IDs and official HTTPS contribution links', () => {
  assert.equal(new Set(initiatives.map(i => i.id)).size, initiatives.length)
  for (const item of initiatives) {
    const source = new URL(item.source); const donate = new URL(item.donate)
    assert.equal(source.protocol, 'https:'); assert.equal(donate.protocol, 'https:')
    assert.equal(source.hostname, donate.hostname)
    assert.ok(item.contribution && item.summary && item.giving.length)
  }
})
