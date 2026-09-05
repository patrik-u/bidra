// App-defined: Vibe Cloud knows only this registered schema and its permissions.
export const OPPORTUNITY_TYPE = 'bidrakartan.opportunity.v1'
export function opportunityType(initiativeSchema) {
  const schema = structuredClone(initiativeSchema)
  schema.$id = OPPORTUNITY_TYPE
  Object.assign(schema.properties, {
    organizationId: { type:'string', maxLength:100 },
    kind: { enum:['campaign','event'] },
    endsAt: {type:'string', format:'date'},
    sourceKey: {type:'string', maxLength:100},
    image: {type:'string', maxLength:2000, pattern:'^https://[^/@]+(?:/|$)'},
    imageCredit: {type:'string', maxLength:300},
    sourceReadAt: {type:'string', format:'date'}
  })
  schema.required = ['title','organization','organizationId','category','region','scope','geography','summary','contribution','source','donate','giving','kind','sourceKey','sourceReadAt']
  for (const field of ['source','donate']) schema.properties[field].pattern='^https://[^/@]+(?:/|$)'
  schema.properties.giving.minItems=1
  const publicSchema=structuredClone(schema);delete publicSchema.$id
  return { id:OPPORTUNITY_TYPE, name:'Insamlade möjligheter', schema,
    publication:{fields:Object.keys(schema.properties),metadataFields:[],searchFields:['title','summary','organization','keywords'],schema:publicSchema,
      inputSchema:{type:'object',additionalProperties:false,required:['reason','rulesVersion'],properties:{reason:{type:'string',minLength:5,maxLength:1000},rulesVersion:{type:'integer',minimum:1}}} } }
}
