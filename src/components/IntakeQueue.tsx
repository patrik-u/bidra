import AIRules, {rulesRequest, decisionLabel, type Assessment} from './AIRules'
import { useEffect, useState } from 'react'
import { vibeClient, vibeOrigin } from '../lib/vibe'
import type { InitiativeDraft } from '../content/initiative'

const base = '/api/managed-apps/app_420b9e39-2820-45c2-b53f-89befa0358b6/content'
const type = 'bidrakartan.discovery.v1'
type Candidate = { entityId: string; editVersion: number; payload: {title:string;url:string;sourceName:string;fetchedAt:string;publishedAt:string;state:string;excerpt:string;proposal:InitiativeDraft;image?:string;imagePrompt:string;warnings:string[]} }
async function request(path: string, body?: unknown) {
  const client = await vibeClient()
  const response = await client.authorizedFetch(new URL(path, vibeOrigin), await client.connect('app:content'), { ...(body ? {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}), signal:AbortSignal.timeout(20000) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Kunde inte läsa granskningskön.')
  return result
}
function ReviewImage({path,title}:{path:string;title:string}) {
  const [src,setSrc]=useState('')
  useEffect(()=>{let alive=true;let objectUrl='';void (async()=>{if(!/^\/images\/generated-[a-f0-9]{40}\.jpg$/.test(path))return;const client=await vibeClient();const result=await client.authorizedFetch(new URL(path,location.origin),await client.connect('app:content'));if(!result.ok)return;objectUrl=URL.createObjectURL(await result.blob());if(alive)setSrc(objectUrl);else URL.revokeObjectURL(objectUrl)})().catch(()=>{});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[path])
  return src?<img src={src} alt={`AI-illustration för ${title}`} loading="lazy"/>:<p>Bildförhandsvisningen kunde inte laddas ännu.</p>
}
export default function IntakeQueue() {
  const [assessments,setAssessments]=useState<Record<string,Assessment>>({}),[filter,setFilter]=useState('all')
  const [items,setItems]=useState<Candidate[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[offset,setOffset]=useState(0),[hasMore,setHasMore]=useState(false)
  async function load(){try{const page=await request(`${base}?templateId=${type}&offset=${offset}`);setItems(page.documents);setHasMore(page.hasMore);setError('')}catch(e){setError(e instanceof Error?e.message:'Kunde inte läsa kön.')}}
  useEffect(()=>{void load()},[offset])
  async function review(item:Candidate,accept:boolean){setBusy(true);setError('');try{
    const entityId=`initiative-${item.entityId}`
    if(accept)await request(base,{action:'save',templateId:'vibe.initiative.v1',entityId,version:0,payload:item.payload.proposal,note:`Förslag från ${item.payload.url}. Källa och AI-förslag måste granskas före publicering.`})
    await request(base,{action:'save',templateId:type,entityId:item.entityId,version:item.editVersion,payload:{...item.payload,state:accept?'accepted':'dismissed'},note:accept?'Överfört till initiativutkast.':'Bortvalt vid redaktionell granskning.'})
    if(accept)location.assign(`/cloud-content?entity=${encodeURIComponent(entityId)}`)
    else await load()
  }catch(e){setError(e instanceof Error?e.message:'Kunde inte spara.')}finally{setBusy(false)}}
  const fresh=items.filter(item=>item.payload.state==='new' && (filter==='all' ? assessments[item.entityId]?.decision!=='rejected' : assessments[item.entityId]?.decision===filter))
  return <section className="intake-queue"><AIRules candidates={items} onAssessments={setAssessments}/><details><summary>Automatiskt insamlade förslag · {fresh.length} på denna sida</summary><p>RSS-källorna kontrolleras dagligen. Förslagen är privata och kan vara nyheter eller redan avslutade aktiviteter. Inget publiceras automatiskt.</p><p><a href="https://console.vibecloud.se/my-apps" target="_blank" rel="noopener noreferrer">Konfigurera appens OpenAI-tjänst i Vibe Cloud</a></p>
    <label>Visa förslag <select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">Granskningskö</option><option value="recommended">Rekommenderade</option><option value="uncertain">Osäkra</option><option value="rejected">Bortsorterade av AI</option></select></label>
    {error&&<p role="alert">{error}</p>}
    {!fresh.length&&<p>Inga nya förslag på denna sida. Nya källfynd dyker upp här efter nästa insamling.</p>}
    {fresh.map(item=><article className="intake-candidate" key={item.entityId}>
      {item.payload.image&&<figure><ReviewImage path={item.payload.image} title={item.payload.title}/><figcaption>AI-genererad illustration – granska motivet</figcaption></figure>}
      {assessments[item.entityId]&&<div><strong>{decisionLabel(assessments[item.entityId].decision)} · regelversion {assessments[item.entityId].version}</strong><p>{assessments[item.entityId].reason}</p><blockquote>{assessments[item.entityId].evidence}</blockquote>{assessments[item.entityId].decision==='rejected'&&<button onClick={()=>void rulesRequest({action:'restore',id:item.entityId}).then(data=>setAssessments(data.assessments)).catch(error=>setError(error.message))}>Återställ till granskningskön</button>}</div>}
      <h3>{item.payload.title}</h3><p>{item.payload.sourceName} · Hämtat {new Date(item.payload.fetchedAt).toLocaleDateString('sv-SE')}</p>
      <a href={item.payload.url} target="_blank" rel="noopener noreferrer">Läs originalkällan ↗</a>
      <p>{item.payload.proposal.summary || 'Sammanfattning saknas – AI har inte bearbetat förslaget.'}</p>
      <details><summary>Källunderlag och bildidé</summary><blockquote>{item.payload.excerpt}</blockquote><p>{item.payload.imagePrompt}</p></details>
      <ul>{item.payload.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>
      <div className="button-row"><button disabled={busy} onClick={()=>void review(item,true)}>Skapa initiativutkast och granska</button><button disabled={busy} onClick={()=>void review(item,false)}>Välj bort</button></div>
    </article>)}
    <div className="button-row"><button disabled={offset===0||busy} onClick={()=>setOffset(Math.max(0,offset-50))}>Föregående</button><button disabled={!hasMore||busy} onClick={()=>setOffset(offset+50)}>Nästa</button><button disabled={busy} onClick={()=>void load()}>Uppdatera kön</button></div>
  </details></section>
}
