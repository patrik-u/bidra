// Run on the Cloud host after registering the app-defined organization type.
// app-spaces-operator.mjs is a bundle of the host's existing AppSpaces class.
// Uses normal membership, schema, history and quota checks, without new credentials.
import { readFileSync } from 'node:fs'
import { AppSpaces } from './app-spaces-operator.mjs'
import { organizationSeed, planOrganizationSeed } from './organization-seed.mjs'
const definitions=JSON.parse(readFileSync('/app/config/apps.json','utf8'))
const spaces=new AppSpaces('/data',definitions.map(item=>({origin:item.origin,...item.management})))
const actor='operator:bidrakartan-organization-registry'
try{
  const app=spaces.byOrigin('https://bidrakartan.se')
  if(!app)throw new Error('Registered app missing')
  const read=type=>{const docs=[];for(let offset=0;offset<10000;offset+=50){const page=spaces.contentList(app.id,app.ownerDid,offset,type);docs.push(...page.documents);if(!page.hasMore)return docs}throw new Error('Pagination limit')}
  const plans=planOrganizationSeed(organizationSeed,read('bidrakartan.organization.v1'),read('vibe.initiative.v1'))
  console.log(JSON.stringify({organizationsToCreate:plans.length,initiativesToCreate:plans.filter(item=>item.createInitiative).length,apply:process.argv.includes('--apply')}))
  if(process.argv.includes('--apply'))for(const item of plans){
    const mutate=body=>spaces.contentMutation(app.id,app.ownerDid,body,actor)
    if(item.createInitiative){
      const saved=mutate({action:'save',templateId:'vibe.initiative.v1',entityId:item.initiativeId,version:0,payload:item.initiative,note:'Redaktionellt grundurval av stående gåvomöjligheter från officiella källor.'})
      mutate({action:'publish',templateId:'vibe.initiative.v1',entityId:item.initiativeId,version:saved.document.editVersion,metadata:{sourceReadAt:item.organization.verifiedAt,checks:{identity:true,source:true,geography:true,donation:true},note:'Officiell stöd- eller gåvosida kontrollerad. Egen kort sammanfattning, inga effektlöften. Ingen påhittad kartposition.'},note:'Grundurval granskat och publicerat för Bidrakartan.'})
    }
    const saved=mutate({action:'save',templateId:'bidrakartan.organization.v1',entityId:item.id,version:0,payload:item.organization,note:'Organisationsregister: grundurval och koppling till stående stöd.'})
    mutate({action:'publish',templateId:'bidrakartan.organization.v1',entityId:item.id,version:saved.document.editVersion,note:'Offentliga organisationsuppgifter och kopplingar aktiverade. Interna anteckningar utelämnade.'})
    console.log(JSON.stringify({organization:item.id,initiative:item.initiativeId,createdInitiative:item.createInitiative}))
  }
}finally{spaces.close()}
