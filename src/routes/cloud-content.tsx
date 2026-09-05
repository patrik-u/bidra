import {LayoutDashboard, Inbox, FileText, PlusCircle, SlidersHorizontal, Archive, ArrowLeft} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { vibeClient, vibeOrigin } from '../lib/vibe'
import { appContentTemplate, bindAppContent, setContentRequest, type AppContentPage } from '../content/editor'
import '../content/editor.css'
import IntakeQueue from '../components/IntakeQueue'
import Organizations from '../components/Organizations'
import InitiativeImages from '../components/InitiativeImages'
import Collection from '../components/Collection'

const app = { id: 'app_420b9e39-2820-45c2-b53f-89befa0358b6', name: 'Bidrakartan' }
const scopes = ['profile:read', 'storage', 'app:content']
function ContentEditor() {
  const root = useRef<HTMLDivElement>(null)
  const [section,setSection]=useState('overview'),[editing,setEditing]=useState(false)
  const [counts,setCounts]=useState({published:0,drafts:0,candidates:0})
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  async function load() {
    const client = await vibeClient()
    if (!await client.resume(scopes)) { setReady(false); return }
    const request: typeof fetch = async (input, init) => {
      const path = typeof input === 'string' ? input : String(input)
      const url = new URL(path, vibeOrigin)
      if (url.origin !== new URL(vibeOrigin).origin || !url.pathname.startsWith(`/api/managed-apps/${app.id}/`)) throw new Error('Ogiltig innehållsadress.')
      const response = await client.authorizedFetch(url, await client.connect('app:content'), { ...init, signal: AbortSignal.timeout(15000) })
      return response
    }
    setContentRequest(request)
    const params = new URLSearchParams(location.search)
    const currentSection=params.get('section')||(params.has('entity')?'initiatives':'overview')
    setSection(currentSection);setEditing(params.has('entity'))
    const response = await request(`/api/managed-apps/${app.id}/content?templateId=vibe.initiative.v1&offset=${encodeURIComponent(params.get('offset') ?? '0')}`)
    if (!response.ok) throw new Error(response.status === 404 || response.status === 403 ? 'Ditt Vibe-konto saknar administratörsåtkomst till Bidrakartan.' : 'Innehållet kunde inte läsas.')
    const page = await response.json() as AppContentPage
    if (root.current) {
      root.current.innerHTML = appContentTemplate(app, page)
      bindAppContent(app, page, '', load)
    }
    const documents=[...page.documents]
    if(currentSection==='overview'){
      documents.length=0
      for(let offset=0;offset<10000;offset+=50){const result=await request(`/api/managed-apps/${app.id}/content?templateId=vibe.initiative.v1&offset=${offset}`);if(!result.ok)throw new Error('Kunde inte läsa översikten.');const data=await result.json() as AppContentPage;documents.push(...data.documents);if(!data.hasMore)break}
      for(let offset=0;offset<10000;offset+=50){const result=await request(`/api/managed-apps/${app.id}/content?templateId=bidrakartan.opportunity.v1&offset=${offset}`);if(!result.ok)throw new Error('Kunde inte läsa insamlade initiativ.');const data=await result.json() as AppContentPage;documents.push(...data.documents);if(!data.hasMore)break}
      let candidates=0
      for(let offset=0;offset<10000;offset+=50){const result=await request(`/api/managed-apps/${app.id}/content?templateId=bidrakartan.discovery.v1&offset=${offset}`);if(!result.ok)throw new Error('Kunde inte läsa kön.');const data=await result.json();candidates+=data.documents.filter((item:{payload:{state:string}})=>item.payload.state==='new').length;if(!data.hasMore)break}
      setCounts({published:documents.filter(item=>item.publishedRevisionId).length,drafts:documents.filter(item=>!item.publishedRevisionId).length,candidates})
    }
    setReady(true)
  }
  useEffect(() => { void load().catch(cause => setError(cause.message)) }, [])
  async function connect() {
    if (busy) return
    const popup = window.open('about:blank', 'bidra-login', 'popup=yes,width=520,height=740,resizable=yes,scrollbars=yes')
    if (!popup) { setError('Tillåt popupfönster för att logga in.'); return }
    setBusy(true); setError('')
    try { await (await vibeClient()).switchAccount(scopes, { popup }); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Inloggningen misslyckades.') }
    finally { try { popup.close() } catch {} setBusy(false) }
  }
  const sections=[{id:'overview',label:'Översikt',Icon:LayoutDashboard},{id:'collection',label:'Automatisk insamling',Icon:Inbox},{id:'pending',label:'Att granska',Icon:Inbox},{id:'rejected',label:'Bortsorterade av AI',Icon:Archive},{id:'initiatives',label:'Initiativ',Icon:FileText},{id:'organizations',label:'Organisationer',Icon:FileText},{id:'create',label:'Skapa nytt',Icon:PlusCircle},{id:'images',label:'Bilder',Icon:FileText},{id:'rules',label:'AI-regler',Icon:SlidersHorizontal},{id:'legacy',label:'Äldre RSS-förslag',Icon:Archive}]
  return <main className={`cloud-editor editorial-dashboard view-${section} ${editing?'is-editing':''}`}><header><a href="/"><img src="/bidra-symbol.svg" width="36" height="36" alt=""/> bidrakartan.<span className="editorial-brand-label">Redaktion</span></a><a href="/"><ArrowLeft size={16}/> Till kartan</a></header>
    <div className="editorial-layout"><aside className="editorial-sidebar"><nav aria-label="Redaktionens avdelningar">{sections.map(({id,label,Icon})=><a key={id} href={`/cloud-content?section=${id}`} aria-current={section===id?'page':undefined}><Icon size={18}/>{label}</a>)}</nav><p>Hantera innehåll och regler för Bidrakartan.</p></aside><div className="editorial-main">
    {!ready && <section><h1>Redaktion</h1><p>Logga in med det Vibe-konto som äger eller administrerar Bidrakartan.</p><button onClick={connect} disabled={busy}>{busy?'Slutför inloggningen i fönstret…':'Logga in'}</button></section>}
    {error&&<p role="alert">{error}</p>}
    {ready&&section==='overview'&&<section><p className="results-eyebrow">REDAKTION</p><h1>Översikt</h1><p>Från insamlat förslag till publicerat initiativ.</p><div className="editorial-metrics"><a href="?section=initiatives"><strong>{counts.published}</strong>Publicerade initiativ</a><a href="?section=initiatives"><strong>{counts.drafts}</strong>Initiativutkast</a><a href="?section=legacy"><strong>{counts.candidates}</strong>Äldre RSS-förslag</a></div><div className="editorial-overview-note"><h2>Insamlingen arbetar i bakgrunden</h2><p>Officiella kataloger och RSS kontrolleras var sjätte timme. AI-bearbetning körs varje timme inom appens anropsgränser. Tydliga möjligheter publiceras automatiskt; osäkra förslag går till granskning.</p><a className="button" href="?section=collection">Följ insamlingen</a> <a className="button secondary" href="?section=rules">Justera AI-regler</a></div></section>}
    {ready&&['rules','legacy'].includes(section)&&<><h1>{sections.find(item=>item.id===section)?.label}</h1><IntakeQueue key={section} mode={section==='rules'?'rules':'queue'} initialFilter="all"/></>}
    {ready&&section==='organizations'&&<Organizations/>}
    {ready&&section==='images'&&<InitiativeImages/>}
    {ready&&['collection','pending','rejected'].includes(section)&&<Collection key={section} initialFilter={section==='pending'?'review':section==='rejected'?'rejected':'all'}/>}
    <div ref={root} hidden={!ready||!['initiatives','create'].includes(section)}/>
    </div></div></main>

}
export const Route = createFileRoute('/cloud-content')({ component: ContentEditor, head: () => ({ meta: [{ title: 'Initiativ · Bidrakartan' }, { name: 'robots', content: 'noindex' }] }) })
