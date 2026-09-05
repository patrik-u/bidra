import { useEffect, useState } from 'react'
import { ImagePlus, RefreshCw } from 'lucide-react'
import { vibeClient } from '../lib/vibe'
type Item={id:string;title:string;organization:string;image?:string;fingerprint:string}
type Choice={id:string;version:number;mode:string;image?:string}
type Job={id:string;entity_id:string;status:string;image?:string;error?:string;prompt:string;created:string}
type State={items:Item[];choices:Choice[];jobs:Job[];pause:{until?:string;message?:string}}
async function request(body?:unknown){
  const client=await vibeClient()
  const response=await client.authorizedFetch(new URL('/api/editor/images',location.origin),await client.connect('app:content'),{...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)})
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Bildkön kunde inte läsas.');return result as State
}
function Preview({path}:{path:string}){
  const [src,setSrc]=useState('')
  useEffect(()=>{let alive=true,objectUrl='';void(async()=>{
    if(new URL(path,location.origin).origin!==location.origin){if(alive)setSrc(path);return}
    const client=await vibeClient();const response=await client.authorizedFetch(new URL(path,location.origin),await client.connect('app:content'))
    if(!response.ok)throw new Error('preview');objectUrl=URL.createObjectURL(await response.blob());if(alive)setSrc(objectUrl);else URL.revokeObjectURL(objectUrl)
  })().catch(()=>{});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[path])
  return src?<img src={src} alt="Tidigare AI-illustration"/>:<span>Läser bild…</span>
}
const statusLabel:Record<string,string>={pending:'I kö',running:'Skapar bild…',done:'Bild skapad',failed:'Kunde inte skapa bilden',cancelled:'Avbruten'}
export default function InitiativeImages(){
  const [state,setState]=useState<State>(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState(''),[instructions,setInstructions]=useState(''),[query,setQuery]=useState('')
  useEffect(()=>{let alive=true;const load=()=>void request().then(result=>{if(alive)setState(result)}).catch(error=>{if(alive)setMessage(error.message)})
    setSelected(new URLSearchParams(location.search).get('image')||'');load();const timer=setInterval(load,10000);return()=>{alive=false;clearInterval(timer)}
  },[])
  async function change(action:string,item?:Item,jobId?:string){
    if(busy)return;setBusy(true);setMessage('')
    try{setState(await request({action,...(item?{id:item.id,fingerprint:item.fingerprint,version:state?.choices.find(choice=>choice.id===item.id)?.version||0,instructions,jobId}:{})}));setMessage(action==='generate'?'Bilden ligger i kön. Nuvarande bild visas tills den nya är klar.':'Bildvalet är sparat.')}catch(error){setMessage(error instanceof Error?error.message:'Kunde inte ändra bilden.')}finally{setBusy(false)}
  }
  const pending=state?.jobs.filter(job=>['pending','running'].includes(job.status)).length||0
  return <section className="initiative-images"><p className="results-eyebrow">REDAKTION</p><h1>Bilder</h1><p>Källans bildförhandsvisning prioriteras. Om en sådan saknas används befintliga bilder eller en AI-illustration. Manuella bildval har alltid företräde.</p>
    <p>{state?`${state.items.filter(item=>item.image).length} av ${state.items.length} initiativ har bild · ${pending} bildjobb i kö eller under arbete`:'Läser bilder…'}</p>
    <p className="hint">Illustrationerna visar inte organisationernas verkliga verksamhet. Generering och omgenerering använder appens bildanrop i <a href="https://console.vibecloud.se/my-apps" target="_blank" rel="noopener noreferrer">Vibe Cloud</a>. Att välja en tidigare bild kostar inga nya anrop.</p>
    {state?.pause.until&&Date.parse(state.pause.until)>Date.now()&&<div role="status"><p>{state.pause.message}</p><button disabled={busy} onClick={()=>void change('resume')}>Fortsätt kön</button></div>}
    {message&&<p role="status">{message}</p>}
    <label className="organization-search">Sök initiativ eller organisation<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <div className="image-editor-grid">{state?.items.filter(item=>(item.title+' '+item.organization).toLocaleLowerCase('sv').includes(query.toLocaleLowerCase('sv'))).map(item=>{
      const jobs=state.jobs.filter(job=>job.entity_id===item.id),working=jobs.some(job=>['pending','running'].includes(job.status)),latest=jobs[0],open=selected===item.id
      return <article key={item.id}>{item.image?<img className="image-editor-current" src={item.image} alt={`Illustration för ${item.organization}`} loading="lazy"/>:<div className="image-editor-empty"><ImagePlus size={32}/><span>{working?'Bilden är på väg':'Ingen bild vald'}</span></div>}
        <div className="image-editor-copy"><span className="hint">{item.organization}</span><h2>{item.title}</h2>{latest&&<p>{statusLabel[latest.status]}{latest.error&&` · ${latest.error}`}</p>}
        <button onClick={()=>{setSelected(open?'':item.id);setInstructions('')}}>{open?'Stäng bildverktyg':'Hantera bild'}</button>
        {open&&<div className="image-editor-tools"><label>Önskat motiv (valfritt)<textarea rows={3} maxLength={2000} placeholder="Exempel: en ljus glänta i en gammal svensk lövskog" value={instructions} onChange={event=>setInstructions(event.target.value)}/></label>
          <button disabled={busy||working} onClick={()=>void change('generate',item)}><RefreshCw size={15}/> {item.image?'Generera om':'Skapa bild'}</button>
          <div className="button-row"><button disabled={busy} onClick={()=>void change('original',item)}>Använd innehållets originalbild</button><button disabled={busy} onClick={()=>void change('hide',item)}>Visa utan bild</button></div>
          <p className="hint">Manuella bildval ersätts inte av automatiken. Ett nytt bildval gäller på sajten direkt. Texter och publiceringsstatus ändras inte.</p>
          {jobs.some(job=>job.status==='done')&&<><h3>Tidigare bilder</h3><div className="image-editor-history">{jobs.filter(job=>job.status==='done'&&job.image).map(job=><div key={job.id}><Preview path={job.image!}/><button disabled={busy} onClick={()=>void change('select',item,job.id)}>Använd bilden</button><details><summary>Bildinstruktion</summary><p>{job.prompt}</p></details></div>)}</div></>}
        </div>}
        </div></article>
    })}</div>
  </section>
}
