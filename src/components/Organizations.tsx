import { useEffect, useState } from 'react'
import { ExternalLink, Plus, Building2 } from 'lucide-react'
import { vibeClient, vibeOrigin } from '../lib/vibe'

const app='app_420b9e39-2820-45c2-b53f-89befa0358b6'
const template='bidrakartan.organization.v1'
type Organization={name:string;website:string;donate:string;region:string;verifiedAt:string;reviewDueAt:string;standingInitiativeId:string;initiativeIds:string[];notes:string}
type Document={entityId:string;id:string;editVersion:number;publishedRevisionId:string|null;payload:Organization}
type Initiative={entityId:string;publishedRevisionId:string|null;payload:{title:string;organization?:string;donate?:string}}
type Check={url:string;checkedAt:string;status:string;message:string;httpStatus?:number}
const empty:Organization={name:'',website:'',donate:'',region:'',verifiedAt:'',reviewDueAt:'',standingInitiativeId:'',initiativeIds:[],notes:''}
async function request(path:string,init?:RequestInit){
  const client=await vibeClient()
  const url=path.startsWith('/api/editor/')?new URL(path,location.origin):new URL(`/api/managed-apps/${app}/${path}`,vibeOrigin)
  const response=await client.authorizedFetch(url,await client.connect('app:content'),{...init,signal:AbortSignal.timeout(20000)})
  const result=await response.json()
  if(!response.ok)throw new Error(result.error||'Organisationsregistret kunde inte läsas.')
  return result
}
async function all(type:string){
  const documents=[]
  for(let offset=0;offset<10000;offset+=50){const page=await request(`content?templateId=${type}&offset=${offset}`);documents.push(...page.documents);if(!page.hasMore)return documents}
  throw new Error('Registret är för stort.')
}
export default function Organizations(){
  const [documents,setDocuments]=useState<Document[]>([]),[initiatives,setInitiatives]=useState<Initiative[]>([]),[checks,setChecks]=useState<Record<string,Check>>({})
  const [selected,setSelected]=useState<Document|null>(null),[draft,setDraft]=useState<Organization|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[query,setQuery]=useState('')
  async function load(){
    const [orgs,items]=await Promise.all([all(template),all('vibe.initiative.v1')]);setDocuments(orgs);setInitiatives(items);setLoaded(true)
    try{setChecks((await request('/api/editor/organizations')).checks)}catch{setMessage('Registret är läst, men länkkontrollerna kunde inte hämtas.')}
  }
  useEffect(()=>{void load().catch(error=>setMessage(error.message))},[])
  const today=new Date().toISOString().slice(0,10)
  const update=(key:keyof Organization,value:string|string[])=>setDraft(previous=>previous?{...previous,[key]:value}:previous)
  async function save(event:React.FormEvent){
    event.preventDefault();if(!draft||busy)return;setBusy(true);setMessage('')
    try{
      if(!initiatives.some(item=>item.entityId===draft.standingInitiativeId))throw new Error('Välj ett befintligt initiativ för det stående stödet.')
      const payload={...draft,initiativeIds:[...new Set([draft.standingInitiativeId,...draft.initiativeIds])]}
      const saved=await request('content',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'save',templateId:template,version:selected?.editVersion??0,...(selected?{entityId:selected.entityId}:{}),payload})})
      // Retain the new version if publication fails, allowing a safe retry.
      setSelected({...saved.document,publishedRevisionId:selected?.publishedRevisionId??null})
      await request('content',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'publish',templateId:template,entityId:saved.document.entityId,version:saved.document.editVersion,note:'Organisationsuppgifter och relationer uppdaterade i Bidrakartans redaktion.'})})
      await load();setDraft(null);setSelected(null);setMessage('Organisationen är sparad. Initiativens texter och publiceringsstatus ändras i Initiativ.')
    }catch(error){setMessage(error instanceof Error?error.message:'Kunde inte spara organisationen.')}finally{setBusy(false)}
  }
  const initiativeLink=(id:string)=>`/cloud-content?section=initiatives&entity=${encodeURIComponent(id)}&offset=${Math.max(0,Math.floor(initiatives.findIndex(item=>item.entityId===id)/50)*50)}`
  const due=documents.filter(doc=>doc.payload.reviewDueAt<=today).length
  return <section className="organizations"><p className="results-eyebrow">REDAKTION</p><h1>Organisationer</h1><p>Ett bestående register, oberoende av nyhetsflöden. En organisation kan ha stående stöd och flera särskilda initiativ.</p>
    <div className="button-row"><span>{loaded?`${documents.length} organisationer · ${due} behöver innehållsgranskas`:'Läser registret…'}</span><button onClick={()=>{setSelected(null);setDraft({...empty});setMessage('')}}><Plus size={16}/> Lägg till organisation</button></div>
    <p className="hint">Gåvolänkar kontrolleras varje vecka. Ett svar från webbplatsen är ingen innehållsgranskning. Fel tar aldrig automatiskt bort ett initiativ.</p>
    {message&&<p role="status">{message}</p>}
    {draft&&<form className="organization-form" onSubmit={save}><h2>{selected?'Redigera organisation':'Ny organisation'}</h2>{selected&&<p className="hint">Id: {selected.entityId}</p>}<fieldset disabled={busy}>
      {([['name','Namn','text'],['website','Officiell webbplats','url'],['donate','Officiell gåvo- eller stödsida','url'],['region','Var arbetet gör nytta','text'],['verifiedAt','Innehållet kontrollerat','date'],['reviewDueAt','Nästa innehållsgranskning','date']] as const).map(([key,label,type])=><label key={key}>{label}<input type={type} required max={key==='verifiedAt'?today:undefined} maxLength={type==='url'?2000:160} value={draft[key]} onChange={event=>update(key,event.target.value)}/></label>)}
      <label>Stående gåvomöjlighet<select required value={draft.standingInitiativeId} onChange={event=>update('standingInitiativeId',event.target.value)}><option value="">Välj initiativ</option>{initiatives.map(item=><option key={item.entityId} value={item.entityId}>{item.payload.organization} · {item.payload.title}</option>)}</select></label><p className="hint">Saknas kortet? Skapa först ett initiativ under Skapa nytt. Att koppla ett utkast publicerar inte initiativet.</p>
      <label>Övriga kopplade initiativ<select multiple size={5} value={draft.initiativeIds} onChange={event=>update('initiativeIds',Array.from(event.target.selectedOptions,option=>option.value))}>{initiatives.map(item=><option key={item.entityId} value={item.entityId}>{item.payload.title}</option>)}</select></label>
      <label>Intern anteckning<textarea rows={3} maxLength={2000} value={draft.notes} onChange={event=>update('notes',event.target.value)}/></label>
      <p className="hint">Spara gör organisationsuppgifterna och kopplingarna offentliga. Den interna anteckningen är privat. Gåvolänken på själva kortet ändrar du i initiativet.</p><div className="button-row"><button type="submit">{busy?'Sparar…':'Spara organisation'}</button><button type="button" onClick={()=>setDraft(null)}>Avbryt</button></div></fieldset></form>}
    <label className="organization-search">Sök organisation<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <div className="organization-list">{documents.filter(doc=>doc.payload.name.toLocaleLowerCase('sv').includes(query.toLocaleLowerCase('sv'))).sort((a,b)=>a.payload.name.localeCompare(b.payload.name,'sv')).map(doc=>{
      const org=doc.payload,check=checks[doc.entityId],currentCheck=check?.url===org.donate?check:null
      const standing=initiatives.find(item=>item.entityId===org.standingInitiativeId)
      return <article key={doc.entityId}><div className="organization-heading"><Building2 size={20}/><div><h2>{org.name}</h2><span>{org.region}</span></div><button onClick={()=>{setSelected(doc);setDraft(structuredClone(org));setMessage('')}}>Redigera</button></div>
        <p><a href={org.donate} target="_blank" rel="noopener noreferrer">Officiell gåvosida <ExternalLink size={13}/></a></p>
        <p className={org.reviewDueAt<=today?'organization-attention':''}>Innehåll granskat {org.verifiedAt} · nästa granskning {org.reviewDueAt}</p>
        <p className={currentCheck&&currentCheck.status!=='reachable'?'organization-attention':''}>{currentCheck?`${currentCheck.message} (${currentCheck.checkedAt.slice(0,10)})`:'Länken väntar på automatisk kontroll.'}</p>
        {standing?.payload.donate!==org.donate&&<p className="organization-attention">Registret och gåvokortet har olika länkar. Kontrollera om initiativets länk ska uppdateras.</p>}
        <div className="organization-links">{org.initiativeIds.map(id=>{const item=initiatives.find(value=>value.entityId===id);return item?<a key={id} href={initiativeLink(id)}>{id===org.standingInitiativeId?'Stående stöd':'Initiativ'}: {item.payload.title} · {item.publishedRevisionId?'Publicerat':'Utkast'}</a>:<span key={id}>Kopplat initiativ saknas: {id}</span>})}</div>
      </article>
    })}</div>
  </section>
}
