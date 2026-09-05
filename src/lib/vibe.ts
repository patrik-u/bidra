import type { VibeSessionClient } from '@vibe/sdk'

export const vibeOrigin = import.meta.env.VITE_VIBE_ORIGIN || 'https://console.vibecloud.se'
const scopes = ['profile:read', 'storage']
let instance: VibeSessionClient | undefined
let startup: Promise<void> | undefined
export async function vibeClient() {
  const { VibeSessionClient } = await import('@vibe/sdk')
  instance ??= new VibeSessionClient({ nodeOrigin: vibeOrigin, callbackPath: '/vibe-callback/' })
  startup ??= instance.completeRedirectCallback().then(completed => {
    if (window.location.pathname.replace(/\/$/, '') === '/vibe-callback' && !completed) throw new Error('Inloggningen har gått ut. Försök igen.')
  }).catch(error => { window.history.replaceState({}, '', '/'); throw error })
  try { await startup } catch (error) { startup = Promise.resolve(); throw error }
  return instance
}

export function savedIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 1000 || !value.every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id))) throw new Error('De sparade initiativen har ett format som Bidrakartan inte kan läsa.')
  return [...new Set(value)]
}

async function request(client: VibeSessionClient, init?: RequestInit) {
  if (!await client.resume(scopes)) throw new Error('Logga in igen för att hämta dina sparade initiativ.')
  const token = await client.connect('storage')
  const response = await client.authorizedFetch(new URL('/api/storage/bookmarks', vibeOrigin), token, { ...init, signal: AbortSignal.timeout(15000) })
  if (!response.ok && response.status !== 409) throw new Error(response.status === 401 || response.status === 403 ? 'Åtkomsten har upphört. Logga in igen.' : 'Vibe Cloud kunde inte nås. Försök igen.')
  return response
}

export async function readSaved(client: VibeSessionClient) {
  const response = await request(client)
  const data = await response.json()
  if (!Number.isInteger(data.version) || data.version < 0) throw new Error('Kunde inte läsa sparade initiativ.')
  return { ids: data.found ? savedIds(data.value) : [], version: data.version as number }
}

// Retry the intended operation against fresh state, never overwrite another device's list.
export async function changeSaved(client: VibeSessionClient, change: (ids: string[]) => string[]) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readSaved(client)
    const ids = savedIds(change(current.ids))
    const response = await request(client, { method: 'PUT', headers: { 'content-type': 'application/json', 'if-match': `"${current.version}"` }, body: JSON.stringify({ value: ids }) })
    if (response.ok) return ids
  }
  throw new Error('Listan ändrades på en annan enhet. Försök igen.')
}
