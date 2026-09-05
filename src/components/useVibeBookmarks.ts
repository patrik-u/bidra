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
  const login = async () => {
    try { await (await vibeClient()).switchAccount(['profile:read', 'storage'], { redirect: true }) }
    catch { setError('Kunde inte starta inloggningen. Försök igen.') }
  }
  const logout = async () => {
    if (lock.current) return
    lock.current = true; setBusy(true)
    try { await (await vibeClient()).logout(); setError(''); notify('Du är utloggad från Bidra på den här enheten.') }
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
  return { saved, profile, busy, error, localCount, login, logout, toggleSave, importLocal, refresh }
}
