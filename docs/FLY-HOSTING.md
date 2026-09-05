# Bidrakartan hosting

Production target: https://bidrakartan.se, with www redirected to the apex.
Fly app: `bidrakartan`, Stockholm, one stateless 256 MB machine with automatic
stop/start. Build and deploy with `fly deploy --config fly.toml --remote-only --ha=false`.
The existing Sites manifest and Worker are retained for the old installation;
Fly uses `Dockerfile.fly` and `server/fly.mjs` instead.

The prerendered frontend is served by Node. `/api/initiatives` reads every page
of the public Vibe Cloud Content endpoint and preserves entity IDs as bookmark
IDs. Failures return an error rather than stale seed data. There are no app
secrets or databases on the Fly frontend. `/admin` redirects to `/cloud-content`;
editor mutations require a Vibe OAuth app:content grant and Cloud owner/admin role.
Sites identity headers grant no permissions on Fly.

The eight already published D1 records were exported on 2026-09-05 into
`cloud/catalog-migration.json`. The old database is retained. App-generated
`cloud/catalog-mutations.json` imports them through Cloud's generic Content
validation; it preserves their prior publication review date and records the
migration provenance, rather than claiming a new source review.

`cloud/registration.json` is deployed as registration data in Vibe Cloud.
The operator-declared origin migration preserves the app space ID, owner,
administrators and Content history. Personal app storage is copied once per
tenant on the first authorized storage request at the new origin. Existing
destination values win. OAuth tokens/grants are not transferred: sign in again.
Bookmarks stored only in the old browser origin remain there and are not
automatically transferable between domains.

DNS (Fly-assigned):

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 66.241.125.230 |
| AAAA | @ | 2a09:8280:1::184:34ca:0 |
| CNAME | www | bidrakartan.se |

Fly certificates have been requested for both hosts. DNS validation must
complete before the custom-domain HTTPS login flow can be checked end to end.
Do not change MX/TXT email records. Check certificates with `fly certs check`.

Validation: typecheck, prerender build, catalog pagination, callback/editor
routes, www redirect, hidden files, rejected injected identity headers, Swedish
search and bookmark conflict tests. Cloud has origin-migration and scope/role tests.
