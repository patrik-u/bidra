import {locationAreas, type Area, type Position} from '../lib/locationAreas'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import InitiativeCard from './InitiativeCard'
import { categoryIcons } from './categoryIcons'
import { LocateFixed, Minus, Plus, MapPinned, Info, Maximize, X, ChevronDown } from 'lucide-react'
import type { Map as LibreMap, Marker } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { categories } from '../data/initiatives'
import type { Initiative } from '../data/initiatives'

type Props = { saved: string[]; onSave: (id: string) => void; items: Initiative[]; selected: string | null; hovered: string | null; onSelect: (id: string) => void; focusTarget: {id:string;coordinates:[number,number]} | null; onShowMap:(item:Initiative)=>void }
export default function InitiativeMap({ items, selected, hovered, onSelect, saved, onSave, focusTarget, onShowMap }: Props) {
  const [iconTargets, setIconTargets] = useState<{ element: HTMLElement; item: Initiative }[]>([])
  const [preview, setPreview] = useState<{ element: HTMLElement; item: Initiative } | null>(null)
  const previewObserver=useRef<ResizeObserver|null>(null)
  const popup = useRef<HTMLElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dismiss = () => { clearTimeout(hideTimer.current); previewObserver.current?.disconnect(); popup.current?.remove(); popup.current = null; setPreview(null) }
  const later = () => { clearTimeout(hideTimer.current); hideTimer.current = setTimeout(dismiss, 180) }
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }; window.addEventListener('keydown', escape); return () => { window.removeEventListener('keydown', escape); clearTimeout(hideTimer.current); previewObserver.current?.disconnect(); popup.current?.remove() } }, [])
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LibreMap | null>(null)
  const markers = useRef<{ id: string; marker: Marker }[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [placesOpen,setPlacesOpen]=useState(false)
  const [areas,setAreas]=useState<Area[]>([]),[locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState('')
  const userMarker=useRef<Marker|null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [legendOpen, setLegendOpen] = useState(false)
  const [loadedTiles, setLoadedTiles] = useState(false)
  const reset = () => mapRef.current?.fitBounds([[10.3, 55.0], [24.5, 69.3]], { padding: 45, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 })
  const goArea=(area:Area)=>{dismiss();if(area.bounds)mapRef.current?.fitBounds(area.bounds,{padding:50,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:500});else if(area.center)mapRef.current?.flyTo({center:area.center,zoom:area.zoom,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:500})}
  const locate=()=>{
    if(!navigator.geolocation){setLocationMessage('Din webbläsare stöder inte platsdelning.');return}
    setLocating(true);setLocationMessage('')
    navigator.geolocation.getCurrentPosition(async position=>{
      const point:Position=[position.coords.longitude,position.coords.latitude]
      goArea({name:'Min plats',center:point,zoom:13})
      try{const {Marker}=await import('maplibre-gl');if(!mapRef.current)return;userMarker.current?.remove();const dot=document.createElement('span');dot.className='my-location-dot';dot.title='Din ungefärliga plats';userMarker.current=new Marker({element:dot}).setLngLat(point).addTo(mapRef.current);setAreas(await locationAreas(point));setLocationMessage('')}catch{setLocationMessage('Zoomade till din plats, men områdesnamnen kunde inte hämtas.')}finally{setLocating(false)}
    },error=>{setLocating(false);setLocationMessage(error.code===1?'Platsåtkomst nekades. Tillåt plats i webbläsaren och försök igen.':'Din plats kunde inte hittas. Försök igen.')},{enableHighAccuracy:false,timeout:12000,maximumAge:60000})
  }
  useEffect(()=>{const close=(event:Event)=>{if(event.type==='scroll' && event.target instanceof Node && popup.current?.contains(event.target))return;dismiss()};window.addEventListener('scroll',close,true);window.addEventListener('resize',close);return()=>{window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close)}},[])
  useEffect(() => {
    let active = true
    let instance: LibreMap | undefined
    let observer: ResizeObserver | undefined
    const timeout = setTimeout(() => { if (active && !instance?.areTilesLoaded()) setFailed(true) }, 18000)
    setFailed(false); setReady(false); setLoadedTiles(false)
    import('maplibre-gl').then(({ Map, AttributionControl, setWorkerUrl }) => {
      if (!active || !container.current) return
      try {
        setWorkerUrl(workerUrl)
        instance = new Map({ container: container.current, style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', bounds: [[10.3, 55.0], [24.5, 69.3]], fitBoundsOptions: { padding: 45 }, minZoom: 3, maxZoom: 16, attributionControl: false, locale: { 'AttributionControl.ToggleAttribution': 'Visa kartans källor', 'Map.Title': 'Initiativ i Sverige' } })
        mapRef.current = instance
        instance.on('movestart',dismiss)
        instance.addControl(new AttributionControl({ compact: true }), 'bottom-right')
        instance.on('load', () => { if (active) { setReady(true); setFailed(false) } })
        instance.on('idle', () => { if (active) { setLoadedTiles(true); setFailed(false); clearTimeout(timeout) } })
        instance.on('error', () => { if (active && !instance?.isStyleLoaded()) setFailed(true) })
        observer = new ResizeObserver(() => instance?.resize())
        observer.observe(container.current)
      } catch { if (active) setFailed(true) }
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; clearTimeout(timeout); observer?.disconnect(); markers.current.forEach(m => m.marker.remove()); markers.current = []; userMarker.current?.remove(); instance?.remove(); mapRef.current = null }
  }, [retry])
  useEffect(() => {
    if(!ready || !focusTarget || !mapRef.current)return
    const frame=requestAnimationFrame(()=>{
      const map=mapRef.current;if(!map)return
      dismiss();map.resize()
      map.flyTo({center:focusTarget.coordinates,zoom:11,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:650})
      container.current?.closest<HTMLElement>('.map-panel')?.focus({preventScroll:true})
      container.current?.scrollIntoView({block:'center',behavior:'instant'})
    })
    return ()=>cancelAnimationFrame(frame)
  },[ready,focusTarget])
  useEffect(() => {
    if (!ready || !mapRef.current) return
    let active = true
    import('maplibre-gl').then(({ Marker }) => {
      if (!active || !mapRef.current) return
      dismiss()
      markers.current.forEach(m => m.marker.remove())
      const targets: { element: HTMLElement; item: Initiative }[] = []
      markers.current = items.filter(item => item.coordinates).map(item => {
        const el = document.createElement('button')
        el.className = 'initiative-marker'; el.type = 'button'
        el.setAttribute('aria-label', `${item.title}, ${item.region}. Visa initiativ`)
        el.style.setProperty('--marker-color', categories.find(c => c.id === item.category)!.color)
        const dot = document.createElement('span'); dot.className = 'marker-icon'; targets.push({ element: dot, item })
        const label = document.createElement('span'); label.className = 'marker-label'
        label.textContent = item.title
        el.append(dot, label)
        el.addEventListener('click', () => { dismiss(); onSelectRef.current(item.id) })
        const show = () => {
          clearTimeout(hideTimer.current); previewObserver.current?.disconnect(); popup.current?.remove()
          const element = document.createElement('div')
          element.className = 'map-card-preview floating-map-card'
          element.addEventListener('mouseenter', () => clearTimeout(hideTimer.current))
          element.addEventListener('mouseleave', later)
          element.addEventListener('focusin', () => clearTimeout(hideTimer.current))
          element.addEventListener('focusout', event => { if (!element.contains(event.relatedTarget as Node)) later() })
          document.body.append(element); popup.current=element
          const positionCard=()=>{const anchor=el.getBoundingClientRect(),width=element.offsetWidth,height=element.offsetHeight;const left=anchor.right+12+width<window.innerWidth?anchor.right+12:anchor.left-width-12;element.style.left=Math.max(8,Math.min(left,window.innerWidth-width-8))+'px';element.style.top=Math.max(8,Math.min(anchor.top-40,window.innerHeight-height-8))+'px'}
          const observer=new ResizeObserver(positionCard);observer.observe(element);positionCard()
          previewObserver.current=observer

          setPreview({ element, item })
        }
        el.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) show() })
        el.addEventListener('mouseleave', later)
        el.addEventListener('focus', show)
        el.addEventListener('blur', later)
        return { id: item.id, marker: new Marker({ element: el, anchor: 'center' }).setLngLat(item.coordinates!).addTo(mapRef.current!) }
      })
      setIconTargets(targets)
    })
    return () => { active = false }
  }, [ready, items])
  useEffect(() => { markers.current.forEach(({ id, marker }) => marker.getElement().classList.toggle('highlighted', id === hovered || id === selected)) }, [hovered, selected, items])
  return <section className="map-panel" aria-label="Karta över Sverige" tabIndex={-1}>
    {iconTargets.map(({element,item}) => { const Icon = categoryIcons[item.category]; return createPortal(<Icon size={18} aria-hidden="true"/>, element, item.id) })}
    {preview && createPortal(<><button className="preview-close" aria-label="Stäng förhandsvisning" onClick={dismiss}><X size={16}/></button><InitiativeCard item={preview.item} saved={saved.includes(preview.item.id)} onSave={() => onSave(preview.item.id)} onOpen={() => { onSelect(preview.item.id); dismiss() }} onShowMap={()=>onShowMap(preview.item)} onHover={() => {}}/></>, preview.element)}
    <div className="map-canvas" ref={container} />
    {!loadedTiles && !failed && <div className="map-loading" role="status"><MapPinned size={27} /><span>Laddar kartan över Sverige…</span></div>}
    {failed && <div className="map-loading map-failed" role="status"><MapPinned size={30} /><strong>Kartan kunde inte laddas</strong><span>Du kan fortfarande utforska alla initiativ i listan.</span><button className="primary-button" onClick={() => setRetry(n => n + 1)}>Försök igen</button></div>}
    <div className="map-topline"><span className="map-location"><span className="live-dot" /> Sverige <span className="map-location-divider" /> {items.filter(i => i.scope === 'local').length} insatsområden</span><button className="map-reset icon-button" onClick={reset} aria-label="Visa hela Sverige" title="Visa hela Sverige"><Maximize size={19} /></button></div>
    <div className="map-place-controls"><button disabled={!ready||locating} onClick={locate}><LocateFixed size={16}/>{locating?'Söker plats…':'Min plats'}</button>
      <div className="map-area-menu" onMouseEnter={()=>{if(matchMedia('(hover: hover)').matches)setPlacesOpen(true)}} onMouseLeave={()=>setPlacesOpen(false)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setPlacesOpen(false)}} onKeyDown={event=>{if(event.key==='Escape'){setPlacesOpen(false);event.currentTarget.querySelector('button')?.focus()}}}>
        <button aria-expanded={placesOpen} aria-controls="map-area-options" onClick={()=>setPlacesOpen(value=>!value)}><MapPinned size={16}/>Visa område<ChevronDown size={14}/></button>
        {placesOpen&&<div className="map-area-options" id="map-area-options"><button onClick={()=>{reset();setPlacesOpen(false)}}>Hela Sverige</button>{areas.map(area=><button key={area.name} onClick={()=>{goArea(area);setPlacesOpen(false)}}>{area.name}</button>)}{!areas.length&&<p>Välj Min plats för lokala områden.</p>}</div>}
      </div>
    </div>
    {locationMessage&&<p className="map-location-message" role="status">{locationMessage}</p>}
    <div className="map-zoom"><button onClick={() => mapRef.current?.zoomIn()} aria-label="Zooma in"><Plus size={20} /></button><button onClick={() => mapRef.current?.zoomOut()} aria-label="Zooma ut"><Minus size={20} /></button></div>
    <div className="map-bottomline"><button className="legend-toggle" aria-expanded={legendOpen} onClick={() => setLegendOpen(v => !v)}><Info size={16} /> Vad visar kartan?</button><span className="national-count">+ {items.filter(i => i.scope === 'national').length} utan kartnål i listan</span></div>
    {legendOpen && <div className="map-legend"><strong>Platser där du kan göra skillnad</strong><p>Markörerna visar ungefärliga insats- eller verksamhetsområden. Stöd utan en enskild lokal plats, i Sverige eller internationellt, hittar du i listan.</p><p>Områden: geoBoundaries (CC BY 3.0/CC0). Ortsnamn: GeoNames (CC BY 4.0). Din plats behandlas i webbläsaren.</p><p>Kartan visar inga jämförelser av behov eller uppmätt effekt.</p><div>{categories.filter(c => items.some(i => i.category === c.id && i.scope === 'local')).map(c => <span key={c.id}><i style={{ background: c.color }} />{c.label}</span>)}</div></div>}
  </section>
}
