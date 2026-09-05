import { discoveryType } from '../cloud/discovery-schema.mjs'
import { organizationType } from '../cloud/organization-schema.mjs'
import { opportunityType } from '../cloud/opportunity-schema.mjs'
import { initiativeContentSchema, INITIATIVE_CONTENT_ID } from '../src/content/initiative.ts'
import { writeFile, mkdir, readFile } from 'node:fs/promises'
const origin = 'https://bidrakartan.se'
const fields = Object.keys(initiativeContentSchema.properties)
const publicSchema = structuredClone(initiativeContentSchema)
delete publicSchema.$id
publicSchema.required = ['title', 'organization', 'category', 'region', 'scope', 'geography', 'summary', 'contribution', 'source', 'donate', 'giving', 'sourceReadAt']
publicSchema.properties.sourceReadAt = { type: 'string', format: 'date' }
for (const key of publicSchema.required) if (publicSchema.properties[key]?.type === 'string') publicSchema.properties[key].minLength = 1
for (const key of ['source', 'donate']) publicSchema.properties[key].pattern = '^https://[^/@]+(?:/|$)'
publicSchema.properties.giving.minItems = 1
publicSchema.allOf = [{ if: { properties: { scope: { const: 'local' } } }, then: { required: ['coordinates'], properties: { coordinates: { type: 'array', prefixItems: [{ type: 'number', minimum: -180, maximum: 180 }, { type: 'number', minimum: -85, maximum: 85 }], items: false, minItems: 2, maxItems: 2 } } } }]
const registration = {
  origin,
  manifest: { version: 1, id: 'bidra', name: 'Bidrakartan', permissions: ['profile:read', 'storage', 'app:content'], contentTemplates: [],
    presentation: { tagline: 'Hitta din hjärtefråga', description: 'Spara initiativ för människor, djur och natur.', logo: `data:image/svg+xml;base64,${(await readFile('public/bidra-symbol.svg')).toString('base64')}`, locale: 'sv', accentColor: '#e60063' } },
  management: { serviceAccess: JSON.parse(await readFile('cloud/service-access.json', 'utf8')), migrateFromOrigin: 'https://bidra.opacic357667.chatgpt.site', ownerHandle: 'opacic', redirectUris: [`${origin}/vibe-callback/`, `${origin}/vibe-callback/?vibe_popup=1`], editorUrl: `${origin}/cloud-content`,
    contentTypes: [{ id: INITIATIVE_CONTENT_ID, name: 'Initiativ', schema: initiativeContentSchema,
      publication: { fields, metadataFields: ['sourceReadAt'], searchFields: ['title', 'summary', 'organization', 'keywords'], schema: publicSchema,
        inputSchema: { type: 'object', additionalProperties: false, required: ['checks', 'sourceReadAt', 'note'], properties: {
          checks: { type: 'object', additionalProperties: false, required: ['identity', 'source', 'geography', 'donation'], properties: Object.fromEntries(['identity', 'source', 'geography', 'donation'].map(key => [key, { const: true }])) },
          sourceReadAt: { type: 'string', format: 'date' }, note: { type: 'string', minLength: 15, maxLength: 2000 }
        } }
      }
    }, discoveryType, organizationType, opportunityType(initiativeContentSchema)] }
}
await mkdir('cloud', { recursive: true })
await writeFile('cloud/registration.json', JSON.stringify(registration, null, 2) + '\n')
