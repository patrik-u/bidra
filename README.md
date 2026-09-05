# Bidra

Svensk tjänst för att hitta sätt att bidra till människor, djur och natur. Vit bas och klarrosa huvudfärg (symbol #f50070, knappar #e60063).

## Teknik

TanStack Start, React och TypeScript förrenderar gränssnittet. Ett Cloudflare Worker-API hämtar publicerade initiativ från D1 (SQLite). Lista, karta, sökning och WebMCP använder samma register. MapLibre laddas separat med uttryckligt paketerad worker; bakgrundskartan kommer från CARTO/OpenStreetMap.

Redaktionen på /admin hanterar utkast, granskning, publicering, arkivering och revisionshistorik. Utkast och publicerad version är separata. Versionskontroll och atomiska transaktioner skyddar mot samtidiga överskrivningar. Sites autentiserar besökaren och servern kontrollerar redaktörens ADMIN_EMAIL på varje skyddad begäran.

## Lokal utveckling

Kör npm ci, npm run build och npm run db:local. Starta sedan npm run dev:api och npm run dev i varsin terminal. Port 3000 visar gränssnittet och vidarebefordrar API-anrop till port 8787. Redaktionen kräver Sites identitetsheaders; integrationstester använder uttryckliga testidentiteter i en isolerad databas. Ingen autentiseringsgenväg finns i produktionskoden.

## Kontroll och drift

Kör npm run typecheck, npm test, npm run build och npm run test:api.

Bygget ger förrenderade sidor i dist/client och ett API i dist/server/index.js. Sites-paketeringen inkluderar Drizzle-migrationer. GitHub lagrar koden; Sites kör webbplatsen och databasen. GitHub-push publicerar inte automatiskt sajten.

Databasschemat finns i db/schema.ts. Generera schemaändringar med npm run db:generate och ändra inte redan tillämpade migrationer. Produktionsvärden anges privat i Sites. wrangler.jsonc är endast lokal konfiguration.

Sökningen är regelbaserad och bokmärken sparas på den egna enheten. Automatisk insamling, AI-sökning, externa organisationskonton och donationsuppföljning återstår. Gåvor hanteras hos organisationerna.

Se [redaktion och drift](docs/REDAKTION.md), [MVP och färdplan](docs/MVP.md) och [bildkällor](docs/ASSETS.md).
