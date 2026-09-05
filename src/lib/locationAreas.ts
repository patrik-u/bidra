export type Position = [number,number]
type Geometry={type:string;coordinates:number[][][]|number[][][][]}
type Feature={properties:{shapeName:string};geometry:Geometry}
type Collection={features:Feature[]}
export type Area={name:string;bounds?:[Position,Position];center?:Position;zoom?:number}
function ringContains([x,y]:Position,ring:number[][]){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside}return inside}
export function contains(point:Position,geometry:Geometry){const polygons=geometry.type==='Polygon'?[geometry.coordinates as number[][][]]:geometry.coordinates as number[][][][];return polygons.some(rings=>ringContains(point,rings[0])&&!rings.slice(1).some(ring=>ringContains(point,ring)))}
function area(feature:Feature):Area{const pairs=feature.geometry.coordinates.flat(feature.geometry.type==='Polygon'?1:2) as number[][];return {name:feature.properties.shapeName,bounds:[[Math.min(...pairs.map(p=>p[0])),Math.min(...pairs.map(p=>p[1]))],[Math.max(...pairs.map(p=>p[0])),Math.max(...pairs.map(p=>p[1]))]]}}
let data:Promise<[Collection,Collection,[string,number,number][]]>|undefined
export async function locationAreas(point:Position):Promise<Area[]>{
 data??=Promise.all(['/geo/ADM1.json','/geo/ADM2.json','/geo/places.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw new Error('Platsnamn kunde inte hämtas.');return response.json()})) as Promise<[Collection,Collection,[string,number,number][]]>
 const [counties,municipalities,places]=await data!
 const county=counties.features.find(f=>contains(point,f.geometry)),municipality=municipalities.features.find(f=>contains(point,f.geometry))
 const result:Area[]=[]
 if(county)result.push(area(county));if(municipality)result.push({...area(municipality),name:municipality.properties.shapeName+' kommun'})
 let best:[string,number,number]|undefined,distance=Infinity
 for(const place of places){const km=Math.hypot((place[1]-point[0])*111*Math.cos(point[1]*Math.PI/180),(place[2]-point[1])*111);if(km<distance){distance=km;best=place}}
 if(best&&distance<10)result.push({name:'Nära '+best[0],center:[best[1],best[2]],zoom:13})
 return result
}
