import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {resolve,join,sep} from 'node:path'
import {openSemantic,indexCatalog,rankSemantic} from '../server/semantic.mjs'
test('semantic index only searches current public revisions and never repeatedly embeds unchanged content',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bidra-semantic-')),s=await openSemantic(dir);let calls=0
 const items=[{id:'forest',title:'Forest',keywords:[]},{id:'ocean',title:'Ocean',keywords:[]}]
 const provider=async texts=>{calls++;return texts.map(t=>t.includes('Forest')?[1,0]:[0,1])}
 try{await indexCatalog(items,s,provider);await indexCatalog(items,s,provider);assert.equal(calls,1);assert.deepEqual(rankSemantic(items,[1,0],s).map(r=>r.id),['forest']);assert.deepEqual(rankSemantic([{...items[0],title:'Changed'}],[1,0],s),[]);await indexCatalog([items[1]],s,provider);assert.deepEqual(rankSemantic(items,[1,0],s),[])
 s.cache('private query',[1,0]);assert.ok(!JSON.stringify(s.db.prepare('SELECT * FROM queries').all()).includes('private query'));assert.deepEqual(s.query('private query'),[1,0]);for(let i=0;i<20;i++)s.reserve();assert.throws(()=>s.reserve())
 }finally{s.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep+'bidra-semantic-'));rmSync(dir,{recursive:true,force:true})}
})
