import test from 'node:test'
import assert from 'node:assert/strict'
import { organizationSeed, planOrganizationSeed } from '../server/organization-seed.mjs'
import { allowedCheckUrl, checkGiftLink, isCheckDue, withOrganizations } from '../server/organizations.mjs'

test('registry seed links existing cards and never overwrites editorial decisions on re-run',()=>{
  const first=planOrganizationSeed(organizationSeed,[],[{entityId:'bris',payload:{organization:'Bris'}}])
  assert.equal(first.length,30)
  const bris=first.find(item=>item.id==='org-bris')
  assert.equal(bris.createInitiative,false)
  assert.equal(bris.organization.standingInitiativeId,'bris')
  assert.equal(new Set(first.map(item=>item.initiativeId)).size,30)
  assert.deepEqual(planOrganizationSeed(organizationSeed,first.map(item=>({entityId:item.id})),[]),[])
  const existingUnpublished=[{entityId:'standing-unicef',payload:{organization:'UNICEF Sverige'}}]
  assert.equal(planOrganizationSeed(organizationSeed,[],existingUnpublished).find(item=>item.id==='org-unicef').createInitiative,false)
})
test('standing support has no invented coordinates, source age never expires it, and related campaigns stay distinct',()=>{
  for(const item of organizationSeed){assert.equal(item.initiative.coordinates,undefined);assert.deepEqual(item.initiative.giving,['pengar'])}
  const items=[{id:'standing',sourceReadAt:'2010-01-01'},{id:'campaign'},{id:'other'}]
  const result=withOrganizations(items,[{entityId:'org-test',payload:{initiativeIds:['standing','campaign'],standingInitiativeId:'standing'}}])
  assert.equal(result.length,3)
  assert.equal(result[0].kind,'standing');assert.equal(result[1].kind,undefined);assert.equal(result[1].organizationId,'org-test')
  assert.deepEqual(result[2],items[2])
})
test('weekly checks respect robots and reject unreviewed hosts and redirects',async()=>{
  assert.equal(allowedCheckUrl('https://127.0.0.1/'),false)
  assert.equal(allowedCheckUrl('https://user@unicef.se/'),false)
  assert.equal(allowedCheckUrl('https://unicef.se.evil.test/'),false)
  const calls=[]
  const blocked=await checkGiftLink('https://unicef.se/stod-oss',async(url,init)=>{calls.push(init.method);return new Response('User-agent: *\nDisallow: /')})
  assert.equal(blocked.status,'manual');assert.deepEqual(calls,['GET'])
  const redirected=[]
  const result=await checkGiftLink('https://unicef.se/stod-oss',async(url)=>{redirected.push(url);return new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}})})
  assert.equal(result.status,'review');assert.equal(redirected.length,1)
})
test('failed link checks only report a review need and do not imply expiry or source verification',async()=>{
  const result=await checkGiftLink('https://unicef.se/stod-oss',async(url,init)=>init.method==='GET'?new Response('',{status:404}):new Response('',{status:503}))
  assert.equal(result.status,'review');assert.equal(result.httpStatus,503)
  assert.equal(result.verifiedAt,undefined);assert.equal(result.published,undefined)
  assert.equal(isCheckDue(result,result.url,Date.parse(result.checkedAt)+86400000),false)
  assert.equal(isCheckDue(result,result.url,Date.parse(result.checkedAt)+7*86400000),true)
  assert.equal(isCheckDue(result,'https://unicef.se/new',Date.parse(result.checkedAt)),true)
})
