import { rulesEndpoint } from './rules-api.mjs'
import { imageStore, imageEndpoint, startInitiativeImages } from './initiative-images.mjs'
import { publicOrganizations, withOrganizations, startOrganizationChecks, organizationsEndpoint } from './organizations.mjs'
import { startIntake } from './intake.mjs'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const root = resolve('dist/client')
const cloud = process.env.VIBE_ORIGIN || 'https://console.vibecloud.se'
const contentUrl = new URL('/api/public/apps/app_420b9e39-2820-45c2-b53f-89befa0358b6/content?templateId=vibe.initiative.v1', cloud)
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' }

export async function catalog(fetcher = fetch) {
  const initiatives = []
  for (let offset = 0; offset < 10000; offset += 50) {
    const url = new URL(contentUrl); url.searchParams.set('offset', String(offset))
    const response = await fetcher(url, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) throw new Error('Cloud content unavailable')
    const page = await response.json()
    if (!Array.isArray(page.documents) || typeof page.hasMore !== 'boolean') throw new Error('Invalid content response')
    for (const document of page.documents) {
      const item = document.payload
      if (document.templateId !== 'vibe.initiative.v1' || !item || !['natur','manniskor','djur','klimat','hav','barn'].includes(item.category)) throw new Error('Invalid initiative')
      initiatives.push({ ...item, id: document.entityId, keywords: item.keywords ?? [] })
    }
    if (!page.hasMore) return { initiatives: withOrganizations(initiatives,await publicOrganizations(fetcher)) }
  }
  throw new Error('Catalog pagination limit reached')
}

async function visibleCatalog(){const data=await catalog();return {initiatives:(await imageStore()).apply(data.initiatives)}}

export const server = createServer(async (request, response) => {
  const send = (status, value) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(value)) }
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-Frame-Options', 'DENY')
  // A cross-origin popup must retain window.opener for the SDK callback.
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  try {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname === '/api/editor/rules') return await rulesEndpoint(request, send)
    if (url.pathname === '/api/editor/images') return await imageEndpoint(request,send,async()=>(await catalog()).initiatives)
    if (url.pathname === '/api/editor/organizations') return await organizationsEndpoint(request, send)
    if (!['GET','HEAD'].includes(request.method)) return send(405, { error: 'Method not allowed' })
    if (url.pathname === '/healthz') return send(200, { ok: true })
    if (request.headers.host === 'www.bidrakartan.se') { response.writeHead(308, { location: `https://bidrakartan.se${url.pathname}${url.search}` }); return response.end() }
    if (url.pathname === '/api/initiatives') return send(200, await visibleCatalog())
    if (url.pathname === '/api/session') return send(200, { admin: false, authenticated: false })
    if (url.pathname.startsWith('/api/')) return send(404, { error: 'Not found' })
    if (url.pathname.replace(/\/$/, '') === '/admin') { response.writeHead(302, { location: '/cloud-content' }); return response.end() }
    if (/^\/images\/generated-[a-f0-9]{40}\.jpg$/.test(url.pathname)) { const published=(await visibleCatalog()).initiatives.some(item=>item.image===url.pathname); if(!published){const auth=request.headers.authorization;if(!auth || auth.length>1024)return send(401,{error:'Authentication required'});const access=await fetch(new URL('/api/managed-apps/app_420b9e39-2820-45c2-b53f-89befa0358b6/content?templateId=vibe.initiative.v1',cloud),{headers:{authorization:auth},signal:AbortSignal.timeout(12000)});if(!access.ok)return send(403,{error:'Forbidden'})} const bytes=await readFile(resolve(process.env.DATA_DIR || '/data', 'images', url.pathname.split('/').pop())); response.writeHead(200, {'content-type':'image/jpeg','cache-control':published?'public, max-age=3600':'private, no-store'}); return response.end(bytes) }
    let path = resolve(root, '.' + decodeURIComponent(url.pathname))
    if (!path.startsWith(root + sep) && path !== root) return send(404, { error: 'Not found' })
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    const body = await readFile(path)
    response.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch (error) {
    send(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 503, { error: 'Innehållet kunde inte hämtas. Försök igen.' })
  }
})
if (process.env.NODE_ENV !== 'test') server.listen(Number(process.env.PORT || 8080), '0.0.0.0')

if (process.env.NODE_ENV !== 'test') void startIntake().catch(error => console.error('Intake startup failed:', error.message))
if (process.env.NODE_ENV !== 'test') void startOrganizationChecks().catch(error => console.error('Organization startup failed:', error.message))
if (process.env.NODE_ENV !== 'test') void startInitiativeImages(async()=>(await catalog()).initiatives).catch(error=>console.error('Image startup failed:',error.message))
