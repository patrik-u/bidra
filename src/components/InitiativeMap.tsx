import { useEffect, useRef, useState } from 'react'
import { LocateFixed, Minus, Plus, MapPinned, Info } from 'lucide-react'
import type { Map as LibreMap, Marker } from 'maplibre-gl'
import { categories } from '../data/initiatives'
import type { Initiative } from '../data/initiatives'

type Props = { items: Initiative[]; selected: string | null; hovered: string | null; onSelect: (id: string) => void }
export default function InitiativeMap({ items, selected, hovered, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LibreMap | null>(null)
  const markers = useRef<{ id: string; marker: Marker }[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [legendOpen, setLegendOpen] = useState(false)
  const [loadedTiles, setLoadedTiles] = useState(false)
  const reset = () => mapRef.current?.fitBounds([[10.3, 55.0], [24.5, 69.3]], { padding: 45, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 })
  useEffect(() => {
    let active = true
    let instance: LibreMap | undefined
    let observer: ResizeObserver | undefined
    const timeout = setTimeout(() => { if (active && !instance?.areTilesLoaded()) setFailed(true) }, 18000)
    setFailed(false); setReady(false); setLoadedTiles(false)
    import('maplibre-gl').then(({ Map, AttributionControl }) => {
      if (!active || !container.current) return
      try {
        instance = new Map({ container: container.current, style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', bounds: [[10.3, 55.0], [24.5, 69.3]], fitBoundsOptions: { padding: 45 }, minZoom: 3, maxZoom: 16, attributionControl: false, locale: { 'AttributionControl.ToggleAttribution': 'Visa kartans källor', 'Map.Title': 'Initiativ i Sverige' } })
        mapRef.current = instance
        instance.addControl(new AttributionControl({ compact: true }), 'bottom-right')
        instance.on('load', () => { if (active) { setReady(true); setFailed(false) } })
        instance.on('idle', () => { if (active) { setLoadedTiles(true); setFailed(false); clearTimeout(timeout) } })
        instance.on('error', () => { if (active && !instance?.isStyleLoaded()) setFailed(true) })
        observer = new ResizeObserver(() => instance?.resize())
        observer.observe(container.current)
      } catch { if (active) setFailed(true) }
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; clearTimeout(timeout); observer?.disconnect(); markers.current.forEach(m => m.marker.remove()); markers.current = []; instance?.remove(); mapRef.current = null }
  }, [retry])
  useEffect(() => {
    if (!ready || !mapRef.current) return
    let active = true
    import('maplibre-gl').then(({ Marker }) => {
      if (!active || !mapRef.current) return
      markers.current.forEach(m => m.marker.remove())
      markers.current = items.filter(item => item.coordinates).map(item => {
        const el = document.createElement('button')
        el.className = 'initiative-marker'; el.type = 'button'
        el.setAttribute('aria-label', `${item.title}, ${item.region}. Visa initiativ`)
        el.title = `${item.title} · ${item.region}`
        el.style.setProperty('--marker-color', categories.find(c => c.id === item.category)!.color)
        const dot = document.createElement('span'); dot.className = 'marker-dot'
        const label = document.createElement('span'); label.className = 'marker-label'
        label.textContent = item.organization === 'Naturarvet' ? item.region.split(',')[0] : item.organization.replace('Stockholms ', '')
        el.append(dot, label)
        el.addEventListener('click', () => onSelectRef.current(item.id))
        return { id: item.id, marker: new Marker({ element: el, anchor: 'center' }).setLngLat(item.coordinates!).addTo(mapRef.current!) }
      })
    })
    return () => { active = false }
  }, [ready, items])
  useEffect(() => { markers.current.forEach(({ id, marker }) => marker.getElement().classList.toggle('highlighted', id === hovered || id === selected)) }, [hovered, selected, items])
  return <section className="map-panel" aria-label="Karta över Sverige">
    <div className="map-canvas" ref={container} />
    {!loadedTiles && !failed && <div className="map-loading" role="status"><MapPinned size={27} /><span>Laddar kartan över Sverige…</span></div>}
    {failed && <div className="map-loading map-failed" role="status"><MapPinned size={30} /><strong>Kartan kunde inte laddas</strong><span>Du kan fortfarande utforska alla initiativ i listan.</span><button className="primary-button" onClick={() => setRetry(n => n + 1)}>Försök igen</button></div>}
    <div className="map-topline"><span className="map-location"><span className="live-dot" /> Sverige <span className="map-location-divider" /> {items.filter(i => i.scope === 'local').length} insatsområden</span><button className="map-reset icon-button" onClick={reset} aria-label="Visa hela Sverige" title="Visa hela Sverige"><LocateFixed size={19} /></button></div>
    <div className="map-zoom"><button onClick={() => mapRef.current?.zoomIn()} aria-label="Zooma in"><Plus size={20} /></button><button onClick={() => mapRef.current?.zoomOut()} aria-label="Zooma ut"><Minus size={20} /></button></div>
    <div className="map-bottomline"><button className="legend-toggle" aria-expanded={legendOpen} onClick={() => setLegendOpen(v => !v)}><Info size={16} /> Vad visar kartan?</button><span className="national-count">+ {items.filter(i => i.scope === 'national').length} rikstäckande i listan</span></div>
    {legendOpen && <div className="map-legend"><strong>Platser där du kan göra skillnad</strong><p>Markörerna visar ungefärliga insats- eller verksamhetsområden. Rikstäckande arbete hittar du i listan.</p><p>Kartan visar inga jämförelser av behov eller uppmätt effekt.</p><div>{categories.filter(c => items.some(i => i.category === c.id && i.scope === 'local')).map(c => <span key={c.id}><i style={{ background: c.color }} />{c.label}</span>)}</div></div>}
  </section>
}
