import { useEffect, useRef, useState } from 'react'
import type { VibeProfile } from '@vibe/sdk'
import { changeSaved, readSaved, savedIds, vibeClient } from '../lib/vibe'

function deviceSaved() {
  try { return savedIds(JSON.parse(localStorage.getItem('bidra-saved') || '[]')) } catch { return [] }
}

export function useVibeBookmarks(notify: (message: string) => void) {
  const [saved, setSaved] = useState<string[]>([])
  const [profile, setProfile] = useState<VibeProfile | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [localCount, setLocalCount] = useState(0)
  const [popupFallback, setPopupFallback] = useState(false)
  const [loginPending, setLoginPending] = useState(false)
  const loginController = useRef<AbortController | null>(null)
  const lock = useRef(false)
  const refresh = async () => {
    if (lock.current) return
    lock.current = true; setBusy(true)
    try {
      const client = await vibeClient()
      if (await client.resume(['profile:read', 'storage'])) {
        const account = await client.profile()
        setProfile(account)
        setSaved((await readSaved(client)).ids)
      } else { setProfile(null); setSaved(deviceSaved()) }
      setLocalCount(deviceSaved().length); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Kunde inte ansluta till Vibe.'); setSaved([]) }
    finally { lock.current = false; setBusy(false) }
  }
  useEffect(() => {
    void refresh()
    const focus = () => { void refresh() }
    window.addEventListener('focus', focus)
    return () => window.removeEventListener('focus', focus)
  }, [])
  const login = async (redirect = false) => {
    if (lock.current) return
    const popup = redirect ? undefined : window.open('about:blank', 'bidra-login', 'popup=yes,width=520,height=740,resizable=yes,scrollbars=yes')
    if (!redirect && !popup) { setPopupFallback(true); return }
    const controller = new AbortController()
    loginController.current = controller
    setLoginPending(true)
    lock.current = true; setBusy(true); setError(''); setPopupFallback(false)
    let completed = false
    try {
      await (await vibeClient()).switchAccount(['profile:read', 'storage'], { redirect, popup: popup ?? undefined, signal: controller.signal })
      completed = true
    } catch {
      if (!controller.signal.aborted) {
        setError('Inloggningen slutfördes inte. Du kan försöka igen eller fortsätta i samma flik.')
        setPopupFallback(true)
      }
    } finally { try { popup?.close() } catch { /* Browser may isolate the popup. */ } loginController.current = null; setLoginPending(false); lock.current = false; setBusy(false) }
    if (completed) { await refresh(); notify('Du är inloggad på Bidrakartan.') }
  }
  const logout = async () => {
    if (lock.current) return
    lock.current = true; setBusy(true)
    try { await (await vibeClient()).logout(); setError(''); notify('Du är utloggad från Bidrakartan på den här enheten.') }
    catch { setError('Utloggad här, men Vibe kunde inte bekräfta återkallningen. Kontrollera Anslutna appar i Vibe Cloud.') }
    finally { setProfile(null); setSaved(deviceSaved()); lock.current = false; setBusy(false) }
  }
  const toggleSave = async (id: string) => {
    if (lock.current || error) { notify('Vänta tills dina sparade initiativ har hämtats, eller försök igen.'); return }
    const adding = !saved.includes(id)
    if (!profile) {
      const next = adding ? [...saved, id] : saved.filter(x => x !== id)
      setSaved(next)
      try { localStorage.setItem('bidra-saved', JSON.stringify(next)); setLocalCount(next.length); notify(adding ? 'Sparat på den här enheten' : 'Borttaget från enheten') }
      catch { notify('Sparat för besöket. Webbläsaren tillåter inte lagring.') }
      return
    }
    lock.current = true; setBusy(true)
    try {
      setSaved(await changeSaved(await vibeClient(), ids => adding ? [...new Set([...ids, id])] : ids.filter(x => x !== id)))
      notify(adding ? 'Sparat på ditt Vibe-konto' : 'Borttaget från ditt Vibe-konto')
    } catch (e) { setError(e instanceof Error ? e.message : 'Kunde inte spara.') }
    finally { lock.current = false; setBusy(false) }
  }
  const importLocal = async () => {
    if (lock.current || !profile || error) return
    lock.current = true; setBusy(true)
    try {
      setSaved(await changeSaved(await vibeClient(), ids => [...new Set([...ids, ...deviceSaved()])]))
      notify('Enhetens sparade initiativ har kopierats till ditt konto.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Kunde inte kopiera.') }
    finally { lock.current = false; setBusy(false) }
  }
  return { saved, profile, busy, error, localCount, popupFallback, loginPending, cancelLogin: () => loginController.current?.abort(), login, logout, toggleSave, importLocal, refresh }
}
