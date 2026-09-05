export const discoveryType = {
  id: 'bidrakartan.discovery.v1', name: 'Insamlade förslag',
  schema: { type: 'object', additionalProperties: false, required: ['title','url','sourceName','fetchedAt','fingerprint','state','excerpt','proposal','imagePrompt','warnings'], properties: {
    title: {type:'string',maxLength:160}, url:{type:'string',maxLength:2000,pattern:'^https://'}, sourceName:{type:'string',maxLength:160}, fetchedAt:{type:'string',maxLength:40}, publishedAt:{type:'string',maxLength:100}, fingerprint:{type:'string',maxLength:64}, state:{enum:['new','accepted','dismissed']}, excerpt:{type:'string',maxLength:1600}, proposal:{type:'object'}, imagePrompt:{type:'string',maxLength:3000}, image:{type:'string',maxLength:200}, warnings:{type:'array',maxItems:12,items:{type:'string',maxLength:300}}
  } }
}
