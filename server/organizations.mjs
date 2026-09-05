import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import robotsParser from 'robots-parser'
import { organizationSeed } from './organization-seed.mjs'

const appId='app_420b9e39-2820-45c2-b53f-89befa0358b6'
const template='bidrakartan.organization.v1'
const week=7*86400000
const agent='BidrakartanLinkCheck'
// Server requests are limited to reviewed official hosts, including redirects.
const hosts=new Set(organizationSeed.flatMap(item=>[new URL(item.organization.donate).hostname,new URL(item.organization.website).hostname]))
export function allowedCheckUrl(value) {
  try {const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password && (!url.port||url.port==='443') && hosts.has(url.hostname)}catch{return false}
}
export async function publicOrganizations(fetcher=fetch) {
  const documents=[]
  for(let offset=0;offset<10000;offset+=50){
    const url=new URL(`/api/public/apps/${appId}/content`,process.env.VIBE_ORIGIN||'https://console.vibecloud.se')
    url.search=new URLSearchParams({templateId:template,offset:String(offset)}).toString()
    const response=await fetcher(url,{signal:AbortSignal.timeout(12000)})
    if(!response.ok)throw new Error('Organisationsregistret kunde inte läsas.')
    const page=await response.json()
    if(!Array.isArray(page.documents)||typeof page.hasMore!=='boolean')throw new Error('Ogiltigt organisationsregister.')
    documents.push(...page.documents)
    if(!page.hasMore)return documents
  }
  throw new Error('Organisationsregistret är för stort.')
}
export function withOrganizations(initiatives,organizations){
  const links=new Map()
  for(const org of organizations)for(const id of org.payload.initiativeIds||[])if(!links.has(id))links.set(id,org)
  return initiatives.map(item=>{
    const org=links.get(item.id)
    return org?{...item,organizationId:org.entityId,...(org.payload.standingInitiativeId===item.id?{kind:'standing'}:{})}:item
  })
}
async function checkedRequest(url,method,fetcher){
  for(let count=0;count<4;count++){
    if(!allowedCheckUrl(url))throw new Error('Adressen behöver godkännas för automatisk kontroll.')
    const response=await fetcher(url,{method,redirect:'manual',headers:{'user-agent':`${agent}/1.0 (+https://bidrakartan.se)`},signal:AbortSignal.timeout(10000)})
    if([301,302,303,307,308].includes(response.status)){
      await response.body?.cancel()
      if(!response.headers.get('location'))throw new Error('Omdirigeringen saknar adress.')
      url=new URL(response.headers.get('location'),url).href
      continue
    }
    return {response,url}
  }
  throw new Error('För många omdirigeringar.')
}
export async function checkGiftLink(url,fetcher=fetch){
  const checkedAt=new Date().toISOString()
  if(!allowedCheckUrl(url))return {url,checkedAt,status:'manual',message:'Värden behöver godkännas för automatisk kontroll.'}
  try{
    const robotsUrl=new URL('/robots.txt',url).href
    const robots=await checkedRequest(robotsUrl,'GET',fetcher)
    if(robots.response.ok){
      const reader=robots.response.body.getReader();let size=0,text=''
      const decoder=new TextDecoder()
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>256000){await reader.cancel();throw new Error('Robots-reglerna behöver kontrolleras manuellt.')}text+=decoder.decode(value,{stream:true})}
      if(robotsParser(robotsUrl,text).isAllowed(url,agent)===false)return {url,checkedAt,status:'manual',message:'Automatisk kontroll avstås enligt robots.txt.'}
    }else if(robots.response.status!==404){await robots.response.body?.cancel();return {url,checkedAt,status:'manual',message:'Kunde inte läsa webbplatsens robots-regler.'}}
    const result=await checkedRequest(url,'HEAD',fetcher)
    await result.response.body?.cancel()
    return {url,checkedAt,status:result.response.ok?'reachable':'review',httpStatus:result.response.status,finalUrl:result.url,message:result.response.ok?'Gåvosidan svarar. Innehållet är inte omgranskat.':'Gåvosidan behöver kontrolleras; den är fortfarande publicerad.'}
  }catch{return {url,checkedAt,status:'review',message:'Kontrollen kunde inte slutföras. Ingen avpublicering har gjorts.'}}
}
let storePromise
export async function organizationChecks(){
  return storePromise??=(async()=>{
    const directory=process.env.DATA_DIR||'/data';await mkdir(directory,{recursive:true})
    const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(join(directory,'organizations.sqlite'))
    db.exec('CREATE TABLE IF NOT EXISTS checks (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
    return {view:()=>Object.fromEntries(db.prepare('SELECT * FROM checks').all().map(row=>[row.id,JSON.parse(row.payload)])),record:(id,value)=>db.prepare('INSERT INTO checks VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(id,JSON.stringify(value))}
  })()
}
export function isCheckDue(previous,url,now=Date.now()){return !previous || previous.url!==url || now-Date.parse(previous.checkedAt)>=week}
export async function startOrganizationChecks(){
  let running=false
  const run=async()=>{
    if(running)return;running=true
    try{
      const organizations=await publicOrganizations(),store=await organizationChecks(),previous=store.view()
      for(const org of organizations)if(isCheckDue(previous[org.entityId],org.payload.donate))store.record(org.entityId,await checkGiftLink(org.payload.donate))
    }finally{running=false}
  }
  const tick=()=>void run().catch(error=>console.error('Organization checks:',error.message))
  tick();const timer=setInterval(tick,3600000);timer.unref()
  return ()=>clearInterval(timer)
}
export async function organizationsEndpoint(request,send){
  if(request.method!=='GET')return send(405,{error:'Metoden stöds inte.'})
  const auth=request.headers.authorization
  if(!auth||auth.length>4096)return send(401,{error:'Logga in som redaktör.'})
  const response=await fetch(`https://console.vibecloud.se/api/managed-apps/${appId}/content?templateId=${template}`,{headers:{authorization:auth},signal:AbortSignal.timeout(15000)})
  if(!response.ok)return send(403,{error:'Du behöver redaktörsåtkomst.'})
  return send(200,{checks:(await organizationChecks()).view()})
}
