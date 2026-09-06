import { ArrowUpRight, Bookmark, Check, MapPin } from 'lucide-react'
import { categories } from '../data/initiatives'
import type { Initiative } from '../data/initiatives'
import { categoryIcons as icons } from './categoryIcons'
import InitiativePhoto from './InitiativePhoto'

export default function InitiativeCard({ item, saved, onSave, onOpen, onHover, onShowMap }: { item: Initiative; saved: boolean; onSave: () => void; onOpen: () => void; onShowMap?: () => void; onHover: (id: string | null) => void }) {
  const category = categories.find(c => c.id === item.category)!
  const Icon = icons[item.category]
  return <article className="initiative-card" onMouseEnter={() => onHover(item.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(item.id)} onBlur={() => onHover(null)}>
    <div className={`card-visual visual-${item.category}`}><button className="card-image-button" onClick={onOpen} aria-label={`Läs om ${item.title}`}>{item.image ? <InitiativePhoto item={item} lazy/> : <div className="category-visual"><Icon strokeWidth={1.1} size={62} /><span>{item.kind === 'standing' ? item.organization : category.label}</span></div>}</button>{item.image?.startsWith('/images/generated-') && <span className="image-credit">AI-illustration</span>}{item.scope === 'local' && item.coordinates && onShowMap ? <button className="card-location card-map-link" onClick={onShowMap} aria-label={`Visa ${item.title} på kartan`} title="Visa på kartan"><MapPin size={14} />{item.region}</button> : <span className="card-location"><MapPin size={12} />{item.region}</span>}<button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label={`${saved ? 'Ta bort' : 'Spara'} ${item.title}`} aria-pressed={saved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>
    <button className="card-copy" onClick={onOpen}><span className="card-organization">{item.organization}<ArrowUpRight size={15} /></span><h3>{item.title}</h3><p>{item.summary}</p></button><div className="card-bottom"><span className={`category-tag tag-${item.category}`}><Icon size={13} />{category.label.split(' & ')[0]}</span><span className="source-note"><Check size={13} /> {item.kind === 'standing' ? 'Stående stöd' : 'Källa finns'}</span></div>
    {item.giving.includes('pengar') && item.donate && <a className="primary-button card-donate" href={item.donate} target="_blank" rel="noopener noreferrer" aria-label={`Ge en gåva till ${item.organization} (öppnas i ny flik)`}>Ge en gåva <ArrowUpRight size={16} aria-hidden="true" /></a>}
  </article>
}
