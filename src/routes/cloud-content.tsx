import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { vibeClient, vibeOrigin } from '../lib/vibe'
import { appContentTemplate, bindAppContent, setContentRequest, type AppContentPage } from '../content/editor'
import '../content/editor.css'
import IntakeQueue from '../components/IntakeQueue'

const app = { id: 'app_420b9e39-2820-45c2-b53f-89befa0358b6', name: 'Bidrakartan' }
const scopes = ['profile:read', 'storage', 'app:content']
function ContentEditor() {
  const root = useRef<HTMLDivElement>(null)
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
    const response = await request(`/api/managed-apps/${app.id}/content?templateId=vibe.initiative.v1&offset=${encodeURIComponent(params.get('offset') ?? '0')}`)
    if (!response.ok) throw new Error(response.status === 404 || response.status === 403 ? 'Ditt Vibe-konto saknar administratörsåtkomst till Bidrakartan.' : 'Innehållet kunde inte läsas.')
    const page = await response.json() as AppContentPage
    if (root.current) {
      root.current.innerHTML = appContentTemplate(app, page)
      bindAppContent(app, page, '', load)
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
  return <main className="cloud-editor"><header><a href="/"><img src="/bidra-symbol.svg" width="36" height="36" alt=""/> bidrakartan.</a><a href="/">Till kartan</a></header>
    {!ready && <section><h1>Redaktion</h1><p>Logga in med det Vibe-konto som äger eller administrerar Bidrakartan.</p><button onClick={connect} disabled={busy}>{busy ? 'Slutför inloggningen i fönstret…' : 'Logga in'}</button></section>}
    {error && <p role="alert">{error}</p>}{ready && <IntakeQueue/>}<div ref={root}/></main>
}
export const Route = createFileRoute('/cloud-content')({ component: ContentEditor, head: () => ({ meta: [{ title: 'Initiativ · Bidrakartan' }, { name: 'robots', content: 'noindex' }] }) })
