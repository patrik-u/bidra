# Bidra owns its content model

`src/content/initiative.ts` defines the initiative draft type and JSON Schema.
`src/content/publication.ts` owns Bidra's publication validation; the editor in
`src/content/editor.ts` owns the form, source checks and review copy.

`node --experimental-strip-types scripts/export-cloud-registration.mjs` produces
`cloud/registration.json`, including the app-defined public schema, review-input
schema, public field selection and presentation. Deploy that artifact through
Vibe Cloud's generic registration configuration. Cloud has no initiative-specific
runtime imports or branches. The schema keeps its original id and digest so
existing pilot drafts remain readable. It does not derive from a post type.

The `/cloud-content` route connects through the Vibe SDK with the explicit
`app:content` scope. Cloud additionally verifies the app origin and the account's
owner/admin membership. Public schema validation is enforced by Cloud as generic
schema validation; Bidra owns additional UX/business validation such as requiring
a source-read date that is not in the future. App owners can manage their content
directly through the generic Cloud API; Cloud does not enforce private app code.

This is still a Content pilot, separate from the operational D1 catalog. The
existing `/admin` editor and visitor-facing initiative list are unchanged.
