# Automatic discovery and review

First delivery, 2026-09-05. The app owns sources, extraction, review rules and
image prompts. Cloud owns generic encrypted app service credentials, capped
OpenAI calls and Content. No source-specific crawler lives in Cloud.

## Sources

| Source | Mechanism | Current use |
| --- | --- | --- |
| https://naturarvet.se/feed/ | Official RSS | Private discovery candidates, not automatically approved initiatives |
| https://goteborg.naturskyddsforeningen.se/feed/ | Official RSS | Local engagement/event leads; location and whether an event is still upcoming require review |
| https://www.volontarbyran.org/nyheter/lansering-av-widgets-ska-gora-volontaruppdrag-lattare-att-hitta?locale=sv | Official widget offering | Investigate feed/API/republication terms; no automated catalogue scraping enabled |
| https://hsr.se/hitta-event/lista | Event catalogue | Candidate for a source adapter after access/reuse terms are established |

RSS availability and permissive robots rules are not a general image or full-text
republication license. The enabled sources are read for private discovery, with
short excerpts and canonical original links. Source photographs are not copied.
Robots is checked before scheduled feed reads, redirects are refused and network
errors fail closed. Feed items only accept HTTPS URLs on the configured source
origin. Add new sources only after reviewing their mechanism and terms.

## Operation

`server/intake.mjs` runs inside the single always-on Fly machine. It checks each
source at most daily and retries queued work hourly. Durable SQLite state and
generated images live on `/data`, a separate Fly volume with snapshots. No Codex
thread or desktop computer is required to keep it running.

ETag/Last-Modified reduce unnecessary transfer. Canonical URL plus title/excerpt
fingerprint deduplicates runs; changed sources create separate review candidates.
No automatic merge into an existing initiative is attempted. The first version
supports RSS, not arbitrary crawling or generic open-data formats. Extraction is
bounded to 30 items/feed, 120 days of discovery history, 10 jobs/hour and 500 stored
candidates. Failed Cloud submissions stop after five attempts and remain on disk.
There is no claim that a feed item is necessarily an active initiative. Event
expiry and precise contribution URLs must be checked in review.

Candidates are private `bidrakartan.discovery.v1` Content. Editors can dismiss
them or transfer a proposal to an initiative draft, then use the existing
publication checklist. Neither the worker nor its service credential can publish.
The service may enrich its initial draft once, only if no human edit/review or
publication has occurred. Audit history identifies the service rather than the
owner as the actor. Transfer to an initiative uses a deterministic ID.

## OpenAI and images

Configure OpenAI on the app card at https://console.vibecloud.se/my-apps.
Keys are encrypted with the existing Cloud service-credential encryption, bound
to the app ID. Private Notes service settings are not implicitly shared.
Text uses gpt-4.1-mini with JSON mode and bounded output; image generation uses
gpt-image-2 at low quality, landscape JPEG. The owner selects monthly call caps;
these are not a guaranteed currency budget. Attempts reserve allowance before
the provider call, including failures and uncertain results.

Without activation, basic source candidates still reach review. Unreviewed basic
candidates wait for AI and can be enriched after activation; already reviewed
candidates are never replaced by automation. Paid live generation has not been
verified without an app-configured key. Protocol and limit tests use mocks.

AI is given short untrusted source text and no tools. It cannot supply coordinates
or contribution links. Summary/category/image prompts remain suggestions. Generated
images are stored once by content hash, with a 64 MiB library guard, and are marked
as AI illustrations. Unpublished images require editor authorization; published
images become readable when referenced by the public catalogue. Source-image
license handling and semantic reuse of the image library are future additions.

## Map

Category icons are shared with the list. Desktop hover and keyboard focus show
the same InitiativeCard component (including save); click opens the existing
detail view. Touch click opens details directly. Escape dismisses the preview.

## References

- https://developers.openai.com/api/docs/guides/structured-outputs#json-mode
- https://developers.openai.com/api/docs/guides/image-generation
- https://mariestad.naturskyddsforeningen.se/bevarade-sidor/bevaka-nyhetsflode-automatiskt/

## Editable editorial AI rules

Redaktion now includes AI-regler: a saved draft, immutable activated versions,
per-stage instructions and source additions. Restoring history loads an editable
copy; activation creates a new version. Optimistic revision checks reject stale
saves. Configuration and assessments live in `/data/rules.sqlite` on the existing
persistent Fly volume, not in Vibe Cloud's generic runtime or Content export.
Include this database with the intake database in host backups.

The worker snapshots the active rules per candidate. It records decision,
reason, verbatim supporting excerpt, contribution type and rule version.
Missing/invalid supporting evidence forces an uncertain classification. Only
recommended candidates get newly generated images. This is a review signal,
not an authorization to publish; automatic publication is still disabled.

Editors can select up to three existing source candidates for a dry run with
unsaved draft rules. This consumes text calls but changes no content, active
configuration or assessments, and generates no images. Explicit reassessment
uses active rules and updates only classification, not existing summaries or
images. Already accepted/dismissed Cloud records remain unchanged and outside
the new-candidate queue. Manual restoration pins the local classification so
subsequent worker or explicit reassessment does not hide it again.

Rules endpoints require a Vibe app:content bearer token validated against Cloud
editor permissions on every request. No service key is sent to the browser.
Source additions supplement global rules; typed output and evidence checks
remain server-enforced. Prompts cannot authorize publication or fabricate
coordinates. Existing already-processed candidates can be selected for explicit
reassessment rather than silently spending calls on every old record.
