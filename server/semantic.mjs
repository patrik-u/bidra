import {mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {aiService} from './rules.mjs'
const hash=s=>createHash('sha256').update(s).digest('hex')
export const searchText=item=>[item.title,item.organization,item.category,item.summary,item.contribution,item.region,...(item.keywords||[])].join('\n').slice(0,2200)
export const cosine=(a,b)=>a.length===b.length?a.reduce((n,x,i)=>n+x*b[i],0)/(Math.hypot(...a)*Math.hypot(...b)||1):0
export async function openSemantic(directory){
 const {DatabaseSync}=await import('node:sqlite');mkdirSync(directory,{recursive:true});const db=new DatabaseSync(join(directory,'semantic.sqlite'))
 db.exec(`PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS vectors(id TEXT PRIMARY KEY,fingerprint TEXT,vector TEXT);CREATE TABLE IF NOT EXISTS queries(hash TEXT PRIMARY KEY,vector TEXT,created TEXT);CREATE TABLE IF NOT EXISTS usage(day TEXT PRIMARY KEY,n INTEGER);`)
 return {db,close:()=>db.close(),
  vector(item){const row=db.prepare('SELECT * FROM vectors WHERE id=? AND fingerprint=?').get(item.id,hash(searchText(item)));return row?JSON.parse(row.vector):null},
  save(item,vector){db.prepare('INSERT INTO vectors VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET fingerprint=excluded.fingerprint,vector=excluded.vector').run(item.id,hash(searchText(item)),JSON.stringify(vector))},
  reserve(){const day=new Date().toISOString().slice(0,10),month=day.slice(0,7);db.exec('BEGIN IMMEDIATE');try{const today=db.prepare('SELECT n FROM usage WHERE day=?').get(day)?.n||0,total=db.prepare('SELECT sum(n) n FROM usage WHERE day LIKE ?').get(month+'%').n||0;if(today>=20||total>=100)throw new Error('Semantic search budget reached');db.prepare('INSERT INTO usage VALUES (?,1) ON CONFLICT(day) DO UPDATE SET n=n+1').run(day);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}},
  query(q){const row=db.prepare('SELECT vector FROM queries WHERE hash=? AND created>?').get(hash(q),new Date(Date.now()-7*86400000).toISOString());return row?JSON.parse(row.vector):null},
  cache(q,v){db.prepare('INSERT INTO queries VALUES (?,?,?) ON CONFLICT(hash) DO UPDATE SET vector=excluded.vector,created=excluded.created').run(hash(q),JSON.stringify(v),new Date().toISOString());db.prepare('DELETE FROM queries WHERE created<?').run(new Date(Date.now()-7*86400000).toISOString())}
 }
}
let shared
const store=()=>shared??=openSemantic(process.env.DATA_DIR||'/data')
async function embed(inputs){const result=await aiService({kind:'embedding',inputs});if(!Array.isArray(result.vectors)||result.vectors.length!==inputs.length||result.vectors.some(v=>!Array.isArray(v)||v.length!==512||v.some(n=>!Number.isFinite(n))))throw new Error('Invalid embedding response');return result.vectors}
export async function indexCatalog(items,s,provider=embed){
 const missing=items.filter(i=>!s.vector(i)).slice(0,40)
 for(let i=0;i<missing.length;i+=5){const batch=missing.slice(i,i+5);const vectors=await provider(batch.map(searchText));batch.forEach((item,j)=>s.save(item,vectors[j]))}
 // Deleted publications never remain searchable, even if the underlying vectors survive briefly.
 const ids=new Set(items.map(i=>i.id));for(const row of s.db.prepare('SELECT id FROM vectors').all())if(!ids.has(row.id))s.db.prepare('DELETE FROM vectors WHERE id=?').run(row.id)
}
export function rankSemantic(items,vector,s){const ranked=items.flatMap(item=>{const v=s.vector(item);return v?[{id:item.id,score:cosine(vector,v)}]:[]}).sort((a,b)=>b.score-a.score);const threshold=Math.max(.38,(ranked[0]?.score||0)-.13);return ranked.filter(r=>r.score>=threshold).slice(0,12)}
export async function startSemantic(load){
 if(process.env.INTAKE_ENABLED!=='true'||!process.env.CLOUD_SERVICE_TOKEN)return ()=>{}
 let running=false;const tick=async()=>{if(running)return;running=true;try{await indexCatalog(await load(),await store())}catch(e){console.error('Semantic indexing:',e.message)}finally{running=false}}
 void tick();const timer=setInterval(tick,3600000);timer.unref();return ()=>clearInterval(timer)
}
let lastQuery=0
const inflight=new Map()
export async function semanticEndpoint(request,send,load){
 if(request.method!=='POST')return send(405,{error:'Metoden stöds inte'})
 if(request.headers.origin&&request.headers.origin!=='https://bidrakartan.se')return send(403,{error:'Fel ursprung'})
 if(!request.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON krävs'})
 try{
  let size=0;const chunks=[];for await(const c of request){size+=c.length;if(size>1000)return send(413,{error:'För lång sökning'});chunks.push(c)}
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(typeof body.query!=='string'||body.query.trim().length<2||body.query.length>200)return send(400,{error:'Skriv 2–200 tecken'})
  const q=body.query.trim().toLocaleLowerCase('sv'),s=await store(),items=await load()
  if(!items.some(i=>s.vector(i)))return send(200,{mode:'lexical',results:[]})
  let vector=s.query(q)
  if(!vector){
   if(inflight.has(q))vector=await inflight.get(q)
   else{if(Date.now()-lastQuery<12000)return send(200,{mode:'lexical',results:[]});s.reserve();lastQuery=Date.now();const p=embed([q]).then(v=>{s.cache(q,v[0]);return v[0]});inflight.set(q,p);try{vector=await p}finally{inflight.delete(q)}}
  }
  return send(200,{mode:'hybrid',results:rankSemantic(items,vector,s)})
 }catch{return send(200,{mode:'lexical',results:[]})}
}
