import { join } from 'node:path'
import { rulesStore, validateRules, buildPrompt, assessment, aiService } from './rules.mjs'
import { sources } from './sources.mjs'
let testing = false
export async function rulesEndpoint(request, send) {
  const auth=request.headers.authorization
  if(!auth || auth.length>4096)return send(401,{error:'Logga in som redaktör.'})
  const access=await fetch('https://console.vibecloud.se/api/managed-apps/app_420b9e39-2820-45c2-b53f-89befa0358b6/content?templateId=bidrakartan.discovery.v1',{headers:{authorization:auth,origin:'https://bidrakartan.se'},signal:AbortSignal.timeout(15000)})
  if(!access.ok)return send(access.status===401?401:access.status>=500?503:403,{error:access.status===401?'Inloggningen har gått ut. Logga in igen.':access.status>=500?'Vibe Cloud kunde inte nås. Försök igen.':'Du behöver redaktörsåtkomst.'})
  const store=await rulesStore()
  if(request.method==='GET')return send(200,store.view())
  if(request.method!=='POST')return send(405,{error:'Metoden stöds inte.'})
  if(request.headers.origin && request.headers.origin!=='https://bidrakartan.se')return send(403,{error:'Fel ursprung.'})
  if(!request.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON krävs.'})
  try {
    let size=0; const chunks=[]
    for await(const chunk of request){size+=chunk.length;if(size>24000)return send(413,{error:'För stort underlag.'});chunks.push(chunk)}
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if(['save','activate'].includes(body.action))return send(200,store.save(body.rules,body.revision,body.action==='activate'))
    if(body.action==='restore'){
      const previous=store.view().assessments[body.id]
      if(!previous)return send(404,{error:'Bedömningen saknas.'})
      store.record(body.id,{...previous,decision:'uncertain',reason:'Manuellt återställd till granskningskön.',manual:true})
      return send(200,store.view())
    }
    if(!['test','reassess'].includes(body.action))return send(400,{error:'Okänd åtgärd.'})
    if(testing)return send(409,{error:'En AI-körning pågår. Försök igen när den är klar.'})
    if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>3||body.ids.some(id=>typeof id!=='string'))return send(400,{error:'Välj 1–3 förslag.'})
    const active=store.active(),rules=body.action==='test'?validateRules(body.rules):active.rules
    const {DatabaseSync}=await import('node:sqlite')
    const db=new DatabaseSync(join(process.env.DATA_DIR||'/data','intake.sqlite'),{readOnly:true})
    let items
    try{items=[...new Set(body.ids)].map(id=>{const row=db.prepare('SELECT payload FROM candidates WHERE id=?').get(id);if(!row)throw new Error('Förslaget saknas i insamlingen.');return {id,item:JSON.parse(row.payload)}})}finally{db.close()}
    testing=true
    try {
      const results=[]
      for(const {id,item} of items){
        if(body.action==='reassess' && store.view().assessments[id]?.manual){results.push({id,title:item.title,skipped:true});continue}
        const source=sources.find(source=>source.id===item.sourceId)
        const {result}=await aiService({kind:'text',prompt:buildPrompt(item,source,rules)})
        const value=assessment(result,item,body.action==='test'?'utkast':active.version)
        if(body.action==='reassess')store.record(id,value)
        results.push({id,title:item.title,...value,summary:typeof result?.summary==='string'?result.summary.slice(0,500):'',imagePrompt:typeof result?.imagePrompt==='string'?result.imagePrompt.slice(0,2000):''})
      }
      return send(200,{results})
    }finally{testing=false}
  }catch(error){return send(error.status||400,{error:error.message||'Kunde inte behandla reglerna.'})}
}
