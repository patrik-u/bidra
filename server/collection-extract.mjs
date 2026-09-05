import { loadBuffer } from 'cheerio'
import robotsParser from 'robots-parser'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parseFeed } from './intake.mjs'

export const digest=value=>createHash('sha256').update(value).digest('hex')
export function canonical(value,base) {
  try {const u=new URL(value,base);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;u.hash='';for(const key of [...u.searchParams.keys()])if(/^(utm_|fbclid|gclid)/i.test(key))u.searchParams.delete(key);u.pathname=u.pathname.replace(/\/$/,'')||'/';return u.href}catch{return null}
}
export const candidateId=url=>'opportunity-'+digest(canonical(url)||url).slice(0,40)
const clean=s=>String(s||'').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim()
export function parsePage(bytes,url) {
  const $=loadBuffer(Buffer.from(bytes)),rawTitle=clean($('h1').first().text()||$('meta[property="og:title"]').attr('content')).slice(0,160)
  const image=canonical($('meta[property="og:image"]').attr('content')||'',url)
  const publishedAt=$('meta[property="article:published_time"]').attr('content')||$('time[datetime]').first().attr('datetime')||''
  $('script,noscript,style,nav,header,footer,aside,select,[role="navigation"],.cookie-banner,.related-posts').remove()
  const root=$('main').first().length?$('main').first():$('article').first().length?$('article').first():$('body')
  const links=root.find('a[href]').map((i,e)=>({url:canonical($(e).attr('href'),url),text:clean($(e).text()).slice(0,160)})).get().filter(x=>x.url)
  // These sections describe other records or site-wide navigation, not this opportunity.
  let excerpt=clean(root.text()).split(/Andra uppdrag nära dig|Relaterade artiklar|Relaterade inlägg/)[0].slice(0,11000)
  const headingAt=excerpt.indexOf(rawTitle);if(rawTitle&&headingAt>0)excerpt=excerpt.slice(headingAt)
  const place=excerpt.match(/Plats:\s*(.+?)\s+Volontäruppdrag/)?.[1]?.slice(0,100)
  return {title:rawTitle,url:canonical(url),excerpt,links:links.slice(0,100),image:image!==canonical(url)?image:undefined,publishedAt,place}
}
export function discover(bytes,source) {
  if(source.mode==='rss')return parseFeed(Buffer.from(bytes).toString('utf8'),source).map(x=>x.url)
  const $=loadBuffer(Buffer.from(bytes));$('nav,header,footer,aside').remove()
  return [...new Set($('a[href]').map((i,e)=>{
    if(source.id==='naturarvet'&&/Skyddad/i.test($(e).text()))return null
    const u=canonical($(e).attr('href'),source.url)
    return u&&new URL(u).origin===new URL(source.url).origin&&new RegExp(source.path).test(new URL(u).pathname)?u:null
  }).get().filter(Boolean))].slice(0,60)
}
export async function sourceReader(source,fetcher=fetch) {
  const origin=new URL(source.url).origin,agent='Bidrakartan/1.0 (+https://bidrakartan.se)'
  async function raw(url,allow404=false) {
    const r=await fetcher(url,{headers:{'user-agent':agent,accept:'text/html,application/rss+xml,text/plain'},redirect:'manual',signal:AbortSignal.timeout(20000)})
    if(r.status>=300&&r.status<400){const next=new URL(r.headers.get('location')||url,url);if(next.origin!==origin||next.username||next.password)throw new Error('Oväntad omdirigering');return {redirect:next.href}}
    if(allow404&&r.status===404)return {bytes:Buffer.alloc(0)}
    if(!r.ok)throw Object.assign(new Error('Källan svarade HTTP '+r.status),{status:r.status})
    const chunks=[];let size=0
    for await(const chunk of r.body){size+=chunk.length;if(size>2*1024*1024)throw new Error('Källsidan är för stor');chunks.push(chunk)}
    return {bytes:Buffer.concat(chunks)}
  }
  const robotsUrl=origin+'/robots.txt',robotsResponse=await raw(robotsUrl,true)
  if(robotsResponse.redirect)throw new Error('Robots-regler kunde inte läsas')
  const robots=robotsParser(robotsUrl,robotsResponse.bytes.toString('utf8'))
  return async url=>{
    let next=url
    for(let i=0;i<4;i++){
      if(new URL(next).origin!==origin||robots.isAllowed(next,'Bidrakartan')===false)throw new Error('Källans robots-regler tillåter inte hämtning')
      const result=await raw(next);if(!result.redirect)return {bytes:result.bytes,url:next};next=result.redirect
    }
    throw new Error('För många omdirigeringar')
  }
}
let places
export function locate(place,excerpt) {
  if(!place||!excerpt.includes(place))return null
  places??=JSON.parse(readFileSync(new URL('../public/geo/places.json',import.meta.url)))
  const matches=places.filter(p=>p[0].toLocaleLowerCase('sv')===place.toLocaleLowerCase('sv'))
  // Ambiguous names (e.g. Gråbo) must never be guessed.
  return matches.length===1?{coordinates:matches[0].slice(1),region:place,scope:'local',geography:`Ungefärlig plats: ${place}. Kartnålen visar orten, inte en exakt besöksadress. Platsdata: GeoNames, CC BY 4.0.`}:null
}
export function curate(result,item,source,version) {
  const evidence=clean(result?.evidence).replace(/^["“”]+|["“”]+$/g,'').slice(0,300)
  let decision=['recommended','uncertain','rejected'].includes(result?.decision)?result.decision:'uncertain'
  const contribution=['gift','time'].includes(result?.contribution)?result.contribution:'none'
  const donate=typeof result?.donate==='string'&&result.donate.trim()?canonical(result.donate,item.url):null
  const linkValid=donate&&(donate===item.url||item.links.some(l=>l.url===donate))&&[new URL(item.url).origin,...(source.donationOrigins||[])].includes(new URL(donate).origin)
  const quotes=evidence.match(/[^.!?]+[.!?]?/g)?.map(x=>x.trim()).filter(Boolean)||[]
  const exact=evidence.length>10&&(item.excerpt.includes(evidence)||(quotes.length<=3&&quotes.every(q=>q.length>10&&item.excerpt.includes(q))))
  const expiry=typeof result?.endsAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(result.endsAt)&&!Number.isNaN(Date.parse(result.endsAt))?result.endsAt:null
  let reason=clean(result?.reason).slice(0,500)||'Otillräckligt underlag.'
  const kind=source.id==='roda-korset-volontar'?'campaign':result?.kind==='event'?'event':'campaign'
  if(decision==='recommended'&&(!exact||!linkValid||contribution==='none'||!(Number(result.confidence)>=0.9)||!clean(result.summary)||!clean(result.contributionText))){decision='uncertain';reason='Behöver granskas: källstöd, bidralänk eller säkerhet räcker inte. '+reason}
  if(decision!=='rejected'&&kind==='event'&&!expiry){decision='uncertain';reason='Aktiviteten saknar ett belagt slutdatum. '+reason}
  if(decision!=='rejected'&&expiry&&(!clean(result?.dateEvidence)||!item.excerpt.includes(clean(result?.dateEvidence)))){decision='uncertain';reason='Slutdatumet saknar källstöd. '+reason}
  if(expiry&&expiry<new Date().toISOString().slice(0,10)){decision='rejected';reason='Aktiviteten är avslutad. '+reason}
  if(/utflykt|bokcirkel|valdebatt|föreläsning/i.test(item.title)&&!/(söker.{0,40}volontär|bemanna|plocka skräp|strandstäd|slåtter)/i.test(item.excerpt)) {decision='rejected';reason='Passiv aktivitet utan konkret gåva eller aktiv arbetsinsats. '+reason}
  // UNICEF's directory mixes dedicated giving pages and news with a shared
  // catastrophe CTA. Start with the reviewed landing-page pattern, keep the
  // news recoverable rather than manufacturing one campaign per news article.
  if(source.id==='unicef'&&!new URL(item.url).pathname.startsWith('/katastrofinsatser/hjalp-')){decision='rejected';reason='Nyhetsartikel med allmän katastrofgåva. Ingen separat kampanj i detta källurval.'}
  if(source.id==='roda-korset'&&!new RegExp(source.path).test(new URL(item.url).pathname)){decision='rejected';reason='Allmän landsinformation. Insamlingen prioriterar riktade gåvosidor från Röda Korsets gåvokatalog.'}
  const geo=locate(item.place||clean(result?.place),item.excerpt)
  const label=item.place||(['Gaza','Ukraina','Sudan','Afghanistan','Bangladesh','Libanon','Nepal','Venezuela','Syrien','Jemen','Somalia','Etiopien','Myanmar','Kongo','Kenya','Haiti','Irak','Iran','Israel','Palestina','Filippinerna','Pakistan'].find(name=>item.title.includes(name)))|| (result?.place&&item.excerpt.includes(result.place)?clean(result.place):'Utan lokal plats')
  const proposal={title:item.title,organization:source.organization,organizationId:source.organizationId,category:['natur','manniskor','djur','klimat','hav','barn'].includes(result?.category)?result.category:source.category,
    region:geo?.region||label.slice(0,100),scope:'national',geography:clean(result?.geography).slice(0,500)||'Ingen säker lokal plats i källan. Du bidrar via organisationens webbplats.',...geo,
    summary:clean(result?.summary).slice(0,550),contribution:clean(result?.contributionText).slice(0,1500),source:item.url,donate:linkValid?donate:item.url,giving:contribution==='gift'?['pengar']:contribution==='time'?['tid']:[],kind,sourceKey:source.id,sourceReadAt:new Date().toISOString().slice(0,10),keywords:Array.isArray(result?.keywords)?result.keywords.filter(k=>typeof k==='string').slice(0,15).map(k=>k.slice(0,80)):[],...(expiry?{endsAt:expiry}:{})}
  // Source previews stay on the source/CDN: no rehosting, no claimed image license.
  if(item.image&&/^https:\/\//.test(item.image)&&!/(logo|open_graph_image|favicon)/i.test(item.image))Object.assign(proposal,{image:item.image,imageCredit:`Bildförhandsvisning från ${source.organization}`})
  return {decision,reason:reason.slice(0,800),evidence,version,proposal,checks:{exactEvidence:exact,observedLink:Boolean(linkValid),confidence:Number(result?.confidence)||0},raw:result}
}
