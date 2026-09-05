import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {defaults,openRules,validateRules,buildPrompt,assessment} from '../server/rules.mjs'
import {rulesEndpoint} from '../server/rules-api.mjs'

test('drafts are isolated, activation is versioned, stale saves conflict and history survives restart',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'bidra-rules-'));let store=await openRules(directory)
 try{
  const changed={...defaults,general:'Ändrad grundregel'}
  store.save(changed,0)
  assert.equal(store.active().rules.general,defaults.general)
  assert.throws(()=>store.save(changed,0,true),/ändrats/)
  store.save(changed,1,true)
  assert.equal(store.active().version,2)
  store.record('candidate',{decision:'uncertain',manual:true,version:2})
  store.close();store=await openRules(directory)
  assert.equal(store.active().rules.general,changed.general)
  assert.equal(store.view().history.length,2)
  assert.equal(store.view().assessments.candidate.manual,true)
  store.save(store.view().history[1].rules,2,true)
  assert.equal(store.active().version,3)
  assert.equal(store.active().rules.general,defaults.general)
 }finally{store.close();assert.ok(resolve(directory).startsWith(resolve(tmpdir())));await rm(directory,{recursive:true})}
})
test('source overrides are bounded and unsupported claims cannot be recommended',()=>{
 assert.throws(()=>validateRules({...defaults,general:''}))
 assert.throws(()=>validateRules({...defaults,sources:{naturarvet:'a'.repeat(1001)}}))
 const item={title:'Skog',excerpt:'Ge en gåva för att bevara skogen.',url:'https://example.test'}
 const result={decision:'recommended',contribution:'gift',reason:'Gåva möjlig',evidence:'Ge en gåva'}
 assert.equal(assessment(result,item,2).decision,'recommended')
 assert.equal(assessment({...result,evidence:'Bli volontär'},item,2).decision,'uncertain')
 assert.equal(assessment({...result,contribution:'none'},item,2).decision,'uncertain')
 assert.equal(assessment(null,item,2).decision,'uncertain')
 const prompt=buildPrompt(item,{id:'naturarvet',name:'Naturarvet'},{...defaults,sources:{naturarvet:'Specifikt tillägg'}})
 assert.ok(prompt.includes('Specifikt tillägg'));assert.ok(prompt.includes('untrusted data'))
})
test('rules endpoint rejects missing or unauthorized credentials before accessing data',async()=>{
 let status;await rulesEndpoint({headers:{}},code=>status=code);assert.equal(status,401)
 const original=globalThis.fetch
 try{globalThis.fetch=async()=>new Response('',{status:403});await rulesEndpoint({headers:{authorization:'Bearer invalid'}},code=>status=code);assert.equal(status,403)}finally{globalThis.fetch=original}
})

test('preview is read-only and manual restoration survives reassessment',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'bidra-rules-api-'))
 const oldDir=process.env.DATA_DIR,original=globalThis.fetch
 process.env.DATA_DIR=directory
 const {DatabaseSync}=await import('node:sqlite')
 const db=new DatabaseSync(join(directory,'intake.sqlite'))
 db.exec('CREATE TABLE candidates(id TEXT PRIMARY KEY,payload TEXT)')
 db.prepare('INSERT INTO candidates VALUES (?,?)').run('one',JSON.stringify({sourceId:'naturarvet',title:'Nyhet',excerpt:'Referat från förra mötet.',url:'https://naturarvet.se/test'}));db.close()
 let calls=0
 globalThis.fetch=async(url)=>{
  if(String(url).includes('/api/managed-apps/'))return Response.json({documents:[]})
  calls++;return Response.json({result:{decision:'rejected',reason:'Ett referat.',evidence:'Referat från förra mötet.',contribution:'none'}})
 }
 const {Readable}=await import('node:stream')
 const call=async(body)=>{
  const request=Readable.from([Buffer.from(JSON.stringify(body))]);request.method='POST';request.headers={authorization:'Bearer editor',origin:'https://bidrakartan.se','content-type':'application/json'}
  let output;await rulesEndpoint(request,(status,data)=>{output={status,data}});return output
 }
 const {rulesStore}=await import('../server/rules.mjs')
 try{
  assert.equal((await call({action:'test',ids:['one'],rules:defaults})).status,200)
  const store=await rulesStore();assert.deepEqual(store.view().assessments,{})
  assert.equal(store.view().revision,0)
  await call({action:'reassess',ids:['one']})
  assert.equal(store.view().assessments.one.decision,'rejected')
  await call({action:'restore',id:'one'})
  await call({action:'reassess',ids:['one']})
  assert.equal(store.view().assessments.one.manual,true)
  assert.equal(store.view().assessments.one.decision,'uncertain')
  assert.equal(calls,2)
 }finally{(await rulesStore()).close();globalThis.fetch=original;if(oldDir===undefined)delete process.env.DATA_DIR;else process.env.DATA_DIR=oldDir;assert.ok(resolve(directory).startsWith(resolve(tmpdir())));await rm(directory,{recursive:true})}
})
