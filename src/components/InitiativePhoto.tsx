import {useEffect,useState} from 'react'
import type {Initiative} from '../data/initiatives'
export default function InitiativePhoto({item,lazy=false}:{item:Initiative;lazy?:boolean}){
 const [src,setSrc]=useState(item.image)
 useEffect(()=>setSrc(item.image),[item.image])
 return src?<img src={src} alt="" width="600" height="400" loading={lazy?'lazy':'eager'} referrerPolicy="no-referrer" onError={()=>setSrc(undefined)}/>:<span className="photo-unavailable">{item.organization}</span>
}
