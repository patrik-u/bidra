# Bidrakartan

Svensk tjänst för att hitta konkreta sätt att ge en gåva eller bidra med tid till människor, djur och natur. Produktion: https://bidrakartan.se.

## Teknik

TanStack Start, React och TypeScript förrenderar gränssnittet. En Node-server på Fly.io serverar sidorna och hämtar publicerat Content från Vibe Cloud. Lista, karta och sökning använder samma katalog. MapLibre visar CARTO/OpenStreetMap med kategoriikoner; osäkra geografiska platser får ingen påhittad kartnål.

Vibe Cloud hanterar Vibe-inloggning, kontots sparade initiativ, appens publicerade Content, redaktörsbehörighet och krypterad OpenAI-konfiguration med anropsgränser. Bidrakartan definierar sina egna Content-typer. Cloud innehåller ingen speciallogik för organisationer, insamling eller kategorisering.

Bidrakartans Fly-server äger källadaptrar, AI-kurering, schemaläggning, lokal granskningskö, bildfiler och sökindex. `/data` är en beständig volym som också måste säkerhetskopieras; en export från Cloud täcker inte allt. Den äldre Cloudflare/D1-implementationen finns kvar för historik och tester men kör inte den nuvarande produktionen.

## Lokal utveckling

Node 22 eller senare krävs för serverns SQLite-stöd. Kör `npm ci` och `npm run build`. Starta `npm run dev:server` och `npm run dev` i varsin terminal. Gränssnittet på port 3000 vidarebefordrar API-anrop till port 8080. Lokala data ligger i ignorerade `.local-data`; bakgrundsjobb är avstängda. Vibe-inloggning kräver en registrerad callback/origin; produktionsinloggning kan inte automatiskt återanvändas på localhost. Ingen lokal redaktörsgenväg finns.

## Kontroll och drift

Kör `npm run typecheck`, `npm test`, `npm run test:server` och `npm run build`. Äldre Worker-registret har separata tester med `npm run test:api`.

Publicera med `fly deploy --config fly.toml --remote-only --ha=false`. Produktion använder en enda alltid startad instans och sin befintliga volym. GitHub-push publicerar inte automatiskt. Lägg aldrig tjänstetoken eller OpenAI-nyckel i Git; Fly hanterar serverhemligheter och Cloud hanterar appens OpenAI-nyckel.

Cloud-registreringen exporteras med `node scripts/export-cloud-registration.mjs`. Registreringens Content-typer, servicebehörigheter och logotyp måste uppdateras i Cloud när dessa ändras. Ändra inte redan registrerade versionerade scheman; lägg till en ny typversion.

Fem källor kontrolleras normalt var sjätte timme; arbetaren kontrollerar kön varje timme. Källstödda AI-rekommendationer publiceras automatiskt. Osäkra och bortsorterade förslag finns i redaktionen. Sökningen kombinerar ordmatchning med semantisk likhet och fungerar med vanlig sökning vid kvot eller tjänstefel. Bokmärken kan sparas på enheten eller Vibe-kontot. Externa organisationskonton och donationsuppföljning återstår. Gåvor hanteras hos organisationerna.

Se [automatisk insamling och sökning](docs/AUTOMATISK-INSAMLING.md), [bilder](docs/BILDGENERERING.md), [Vibe-kontokopplingen](docs/VIBE-KONTO.md) och [feedbackstyrd utveckling](docs/FEEDBACK-UTVECKLING.md). Äldre färdplaner beskriver tidigare skeden av projektet.
