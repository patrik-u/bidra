import test from 'node:test'
import assert from 'node:assert/strict'
import {parseFeed,fetchFeed,proposalPrompt} from '../server/intake.mjs'
const source={name:'Test',url:'https://source.test/feed/'}
const xml=body=>`<rss><channel>${body}</channel></rss>`
const item=(link,title='Hjälp skogen',description='Delta och bevara skog')=>`<item><title>${title}</title><link>${link}</link><description><![CDATA[${description}]]></description></item>`
test('RSS canonicalization, fingerprints, private URLs and XML entity attacks',()=>{
  const feed=parseFeed(xml(item('https://source.test/help?utm_source=rss')),source)
  assert.equal(feed[0].url,'https://source.test/help');assert.equal(feed[0].fingerprint.length,64)
  assert.equal(parseFeed(xml(item('https://127.0.0.1/private')),source).length,0)
  assert.equal(parseFeed(xml(item('https://user:pass@source.test/private')),source).length,0)
  assert.throws(()=>parseFeed('<!DOCTYPE rss><rss/>',source))
  assert.notEqual(parseFeed(xml(item('https://source.test/help','Hjälp skogen','Nytt stöd till skogen')),source)[0].fingerprint,feed[0].fingerprint)
  assert.ok(proposalPrompt(feed[0],source).includes('untrusted data'))
})
test('conditional fetch, failed source and bounded feed size',async()=>{
  const unchanged=await fetchFeed(source,{etag:'abc'},async(_,init)=>{assert.equal(init.headers['if-none-match'],'abc');assert.equal(init.redirect,'error');return new Response(null,{status:304})})
  assert.equal(unchanged.unchanged,true)
  await assert.rejects(fetchFeed(source,{},async()=>new Response('',{status:503})))
  await assert.rejects(fetchFeed(source,{},async()=>new Response('x'.repeat(1024*1024+1))))
})
