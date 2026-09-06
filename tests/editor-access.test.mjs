import test from 'node:test'
import assert from 'node:assert/strict'
import {collectionEndpoint} from '../server/collection.mjs'
import {rulesEndpoint} from '../server/rules-api.mjs'
import {organizationsEndpoint} from '../server/organizations.mjs'
import {imageEndpoint} from '../server/initiative-images.mjs'

test('editor proxies supply the registered app origin and preserve refreshable authentication failures',async()=>{
 const original=globalThis.fetch
 try{
  for(const endpoint of [collectionEndpoint,rulesEndpoint,organizationsEndpoint,imageEndpoint]){
   for(const upstream of [401,403,503]){
    let forwarded=false,result
    globalThis.fetch=async(url,options)=>{
     assert.equal(new URL(url).origin,'https://console.vibecloud.se')
     assert.equal(options.headers.origin,'https://bidrakartan.se')
     assert.equal(options.headers.authorization,'Bearer synthetic-test-token')
     forwarded=true;return new Response('',{status:upstream})
    }
    await endpoint({method:'GET',headers:{authorization:'Bearer synthetic-test-token'}},(status,body)=>{result={status,...body}})
    assert.ok(forwarded);assert.equal(result.status,upstream)
    if(upstream!==403)assert.ok(!result.error.includes('redaktörsåtkomst'))
   }
  }
 }finally{globalThis.fetch=original}
})
