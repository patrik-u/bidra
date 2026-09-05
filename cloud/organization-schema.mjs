export const ORGANIZATION_TYPE = 'bidrakartan.organization.v1'
export const organizationType = {
  id: ORGANIZATION_TYPE, name: 'Organisationer',
  schema: {
    type: 'object', additionalProperties: false,
    required: ['name', 'website', 'donate', 'region', 'verifiedAt', 'reviewDueAt', 'initiativeIds', 'standingInitiativeId', 'notes'],
    properties: {
      name: {type:'string', minLength:1, maxLength:160},
      website: {type:'string', maxLength:2000, pattern:'^https://[^/@]+(?:/|$)'},
      donate: {type:'string', maxLength:2000, pattern:'^https://[^/@]+(?:/|$)'},
      region: {type:'string', minLength:1, maxLength:160},
      verifiedAt: {type:'string', format:'date'}, reviewDueAt: {type:'string', format:'date'},
      initiativeIds: {type:'array', maxItems:100, uniqueItems:true, items:{type:'string', pattern:'^[a-zA-Z0-9-]{1,80}$'}},
      standingInitiativeId: {type:'string', pattern:'^[a-zA-Z0-9-]{1,80}$'},
      notes: {type:'string', maxLength:2000},
    },
  },
}
const publicSchema=structuredClone(organizationType.schema)
delete publicSchema.properties.notes
publicSchema.required=publicSchema.required.filter(field=>field!=='notes')
organizationType.publication={fields:Object.keys(publicSchema.properties),searchFields:['name','region'],schema:publicSchema}
