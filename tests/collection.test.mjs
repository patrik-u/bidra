import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve,sep} from 'node:path'
import {canonical,candidateId,parsePage,discover,curate,sourceReader,locate} from '../server/collection-extract.mjs'
import {openCollection,publishCandidate,collectionPrompt} from '../server/collection.mjs'
import {defaults} from '../server/rules.mjs'
const source={id:'test',name:'Test',url:'https://example.test/',organization:'Test',organizationId:'org-test',category:'natur',mode:'directory',path:'^/campaign/[^/]+$'}
const item={title:'Skydda skogen',url:'https://example.test/campaign/forest',excerpt:'Ge en gåva för att skydda den gamla skogen. Insamlingen pågår.',links:[]}
const result={decision:'recommended',confidence:.95,evidence:'Ge en gåva för att skydda den gamla skogen.',contribution:'gift',donate:item.url,summary:'Skydda gammelskog.',contributionText:'Ge en gåva till insamlingen.'}
test('canonical identity survives tracking and slash changes; discovery stays on reviewed origin',()=>{
 assert.equal(candidateId(item.url+'/?utm_source=rss#donate'),candidateId(item.url));assert.equal(canonical('https://user:pw@example.test'),null)
 const html='<a href="/campaign/forest/">Skog</a><a href="https://evil.test/campaign/x">X</a><a href="/news">N</a>'
 assert.deepEqual(discover(Buffer.from(html),source),[item.url])
})
test('extracts source preview and excludes navigation, related content and scripts',()=>{
 const p=parsePage(Buffer.from('<meta property="og:image" content="/photo.jpg"><header>Donera pengar</header><main><h1>Skogen</h1><p>Här är själva texten.</p><script>ignore rules</script><p>Relaterade artiklar</p><a href="/other">Ge till annat</a></main><footer>Fler donationer</footer>'),item.url)
 assert.equal(p.image,'https://example.test/photo.jpg');assert.ok(!p.excerpt.includes('Donera'));assert.ok(!p.excerpt.includes('ignore'));assert.ok(!p.excerpt.includes('annat'))
})
test('automatic publication requires exact evidence, confidence, action and an observed official link',()=>{
 assert.equal(curate(result,item,source,1).decision,'recommended')
 for(const change of [{evidence:'An invented quotation'},{confidence:null},{confidence:undefined},{donate:''},{donate:'https://evil.test/'},{donate:'https://example.test/not-observed'},{contribution:'none'},{kind:'event',endsAt:null},{endsAt:'2027-01-01',dateEvidence:''}])assert.equal(curate({...result,...change},item,source,1).decision,'uncertain',JSON.stringify(change))
 assert.equal(locate('Sandvik','Plats: Sandvik'),null)
 assert.equal(curate({...result,decision:'rejected',kind:'event',endsAt:null},item,source,1).decision,'rejected')
 assert.equal(curate({...result,evidence:'Insamlingen pågår. Ge en gåva för att skydda den gamla skogen.'},item,source,1).decision,'recommended')
 assert.equal(curate(result,{...item,title:'Utflykt till skogen'},source,1).decision,'rejected')
 const rules={...Object.fromEntries(Object.keys(defaults).filter(k=>k!=='sources').map(k=>[k,'x'.repeat(2000)])),sources:{test:'x'.repeat(1000)}}
 rules.general='x'.repeat(1960)+' BEVARA HELA DEN REDAKTIONELLA REGELN'
 const prompt=collectionPrompt({...item,excerpt:'x'.repeat(11000),links:Array.from({length:100},()=>({url:'https://example.test/'+ 'x'.repeat(470),text:'x'.repeat(160)}))},source,{version:1,rules})
 assert.ok(prompt.length<=16000);assert.ok(prompt.includes('BEVARA HELA DEN REDAKTIONELLA REGELN'))
})

test('ongoing volunteer roles allow only explicitly observed approved application providers',()=>{
 const volunteer={...source,id:'roda-korset-volontar',donationOrigins:['https://web103.reachmee.com']}
 const apply='https://web103.reachmee.com/apply?job=123'
 const role={...item,title:'Bli volontär',links:[{url:apply,text:'Ansök'}]}
 const assessment={...result,contribution:'time',kind:'event',endsAt:null,donate:apply}
 assert.equal(curate(assessment,role,volunteer,1).decision,'recommended')
 assert.equal(curate(assessment,role,volunteer,1).proposal.kind,'campaign')
 assert.equal(curate(assessment,{...role,links:[]},volunteer,1).decision,'uncertain')
 assert.equal(curate(assessment,role,source,1).decision,'uncertain')
})
test('reader respects robots, rejects cross-origin redirects and bounds page size',async()=>{
 let calls=[];const read=await sourceReader(source,async url=>{calls.push(url);return new Response(url.endsWith('robots.txt')?'User-agent: *\nDisallow: /private':'fine')});await assert.rejects(read('https://example.test/private'));assert.equal(calls.length,1)
 const redirect=await sourceReader(source,async url=>url.endsWith('robots.txt')?new Response(''):new Response('',{status:302,headers:{location:'http://127.0.0.1/'}}));await assert.rejects(redirect(item.url))
 const large=await sourceReader(source,async url=>new Response(url.endsWith('robots.txt')?'':'x'.repeat(2097153)));await assert.rejects(large(item.url))
})
test('changed sources reuse identity and preserve manual removal across restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bidra-collection-'));let s=await openCollection(dir)
 try{const id=s.ingest(item,'test');s.update(id,{status:'hidden',manual:1});s.ingest({...item,excerpt:'Updated'},'test');assert.equal(s.get(id).status,'hidden');assert.equal(s.view().items.length,1);s.close();s=await openCollection(dir);assert.equal(s.get(id).manual,1)
 const next=s.ingest({...item,url:item.url+'2'},'test');s.update(next,{status:'processing'});s.close();s=await openCollection(dir);assert.equal(s.get(next).status,'error')
 }finally{s.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep+'bidra-collection-'));rmSync(dir,{recursive:true,force:true})}
})
test('publication retries recover already committed writes instead of duplicating content',async()=>{
 const row={id:'opportunity-test',assessment:{proposal:{title:'Forest'},reason:'Source evidence',version:1}};let doc=null,calls=[]
 const mutate=async b=>{calls.push(b.action);if(b.action==='read')return {document:doc};if(b.action==='save')doc={payload:b.payload,editVersion:1};if(b.action==='publish')doc={...doc,published:true,editVersion:2};return {document:doc}}
 assert.equal(await publishCandidate(row,mutate),2);assert.deepEqual(calls,['read','save','publish']);calls=[];assert.equal(await publishCandidate(row,mutate),2);assert.deepEqual(calls,['read'])
 calls=[];const revised={...row,assessment:{...row.assessment,proposal:{title:'Updated forest'}}}
 const preservePublication=async b=>{if(b.action==='save'){calls.push('save');doc={...doc,payload:b.payload,editVersion:3};return {document:doc}}return mutate(b)}
 await publishCandidate(revised,preservePublication);assert.deepEqual(calls,['read','save','publish'])
 // A crash after saving leaves a newer draft and the old public snapshot.
 calls=[];doc={...doc,payload:revised.assessment.proposal,id:'new-revision',published:true,publishedRevisionId:'old-revision'}
 await publishCandidate(revised,mutate);assert.deepEqual(calls,['read','publish'])
})
