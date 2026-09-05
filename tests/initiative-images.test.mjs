import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {openImageStore,imageFingerprint,imagePrompt,processImageJob,imageEndpoint} from '../server/initiative-images.mjs'
const item={id:'standing-test',title:'Bevara gammelskog',organization:'Skog',category:'natur',summary:'Bevara en lövskog.',contribution:'Ge en gåva.',geography:'Sverige'}
const jpeg=Buffer.from([255,216,1,2,3,255,217])
async function setup(t){const directory=await mkdtemp(join(tmpdir(),'bidra-images-'));const store=await openImageStore(directory);t.after(()=>store.close());return {directory,store}}

test('discovers any published source once, preserves existing images and saves a reusable image',async t=>{
  const {store}=await setup(t),stock={...item,id:'stock',image:'/images/forest.jpg'}
  store.discover([item,stock]);store.discover([item,stock]);assert.equal(store.view().jobs.length,1)
  let calls=0;await processImageJob(store,async()=>[item],async()=>{calls++;return jpeg})
  const publicItem=store.apply([item])[0];assert.match(publicItem.image,/generated-/)
  assert.deepEqual(store.apply([stock]),[stock]);store.discover([item]);assert.equal(await processImageJob(store,async()=>[item]),false);assert.equal(calls,1)
})
test('regeneration retains old image and a newer manual decision wins an in-flight result',async t=>{
  const {store}=await setup(t);store.discover([item]);await processImageJob(store,async()=>[item],async()=>jpeg)
  const original=store.apply([item])[0].image
  store.queue(item,imagePrompt(item,'En solig glänta'),true,store.get(item.id).version)
  assert.equal(store.apply([item])[0].image,original)
  const running=store.take();store.choose(item,{action:'hide',version:store.get(item.id).version})
  store.complete(running,Buffer.from([255,216,4,5,255,217]));assert.equal(store.apply([item])[0].image,undefined)
  store.discover([item]);assert.equal(store.view().jobs.length,2)
  const previous=store.jobs(item.id).find(job=>job.image===original)
  store.choose(item,{action:'select',jobId:previous.id,version:store.get(item.id).version});assert.equal(store.apply([item])[0].image,original)
  assert.throws(()=>store.choose(item,{action:'hide',version:0}),/ändrats/)
})
test('changed and unpublished content cannot acquire a stale illustration',async t=>{
  const {store}=await setup(t);store.discover([item]);let calls=0
  await processImageJob(store,async()=>[],async()=>{calls++;return jpeg});assert.equal(calls,0)
  const changed={...item,summary:'Nu handlar det om havet.'};store.discover([changed]);await processImageJob(store,async()=>[changed],async()=>jpeg)
  assert.equal(store.apply([item])[0].image,undefined)
  assert.match(store.apply([changed])[0].image,/generated-/)
  const changedAgain={...changed,summary:'En ny beskrivning.'};store.discover([changedAgain]);assert.equal(store.apply([changedAgain])[0].image,undefined)
})
test('quota pauses without sending more requests; uncertain failures are not retried automatically',async t=>{
  const {store}=await setup(t);store.discover([item]);let calls=0
  await processImageJob(store,async()=>[item],async()=>{calls++;throw Object.assign(new Error('quota'),{status:429})})
  assert.equal(store.view().jobs[0].status,'pending');assert.equal(store.take(),null);assert.equal(calls,1)
  store.resume();await processImageJob(store,async()=>[item],async()=>{calls++;throw new Error('network lost')})
  assert.equal(store.view().jobs[0].status,'failed');store.discover([item]);store.resume();assert.equal(store.take(),null);assert.equal(calls,2)
})
test('restart preserves choices and marks an interrupted paid call for explicit retry',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'bidra-image-restart-'));let store=await openImageStore(directory)
  store.discover([item]);store.take();store.close();store=await openImageStore(directory)
  try{assert.equal(store.view().jobs[0].status,'failed');store.discover([item]);assert.equal(store.take(),null)}finally{store.close()}
})
test('unrelated image history cannot be chosen and non-JPEG provider responses fail',async t=>{
  const {store}=await setup(t);store.discover([item]);const job=store.take()
  assert.throws(()=>store.complete(job,Buffer.from('not an image')),/JPEG/)
  assert.throws(()=>store.choose(item,{action:'select',jobId:'unrelated',version:store.get(item.id).version}),/historik/)
  assert.notEqual(imageFingerprint(item),imageFingerprint({...item,image:'/images/forest.jpg'}))
  assert.match(imagePrompt(item),/not instructions/)
})
test('image administration rejects missing and unauthorized credentials before reading content',async()=>{
  let status,loaded=false;await imageEndpoint({headers:{}},(code)=>status=code,async()=>{loaded=true;return []})
  assert.equal(status,401);assert.equal(loaded,false)
  const original=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:403})
  try{await imageEndpoint({headers:{authorization:'Bearer invalid'},method:'GET'},code=>status=code,async()=>{loaded=true;return []});assert.equal(status,403);assert.equal(loaded,false)}finally{globalThis.fetch=original}
})
