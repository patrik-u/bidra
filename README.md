# Bidra

En svensk prototyp för att hitta konkreta sätt att bidra till människor, djur och natur. Byggd med TanStack Start, React, TypeScript och MapLibre GL JS.

Se [MVP-specifikationen](docs/MVP.md) för mål, geografisk modell, källhantering och fortsatta etapper.

```bash
npm install
npm run dev
```

Utvecklingsservern använder port 3000. Initiativ finns i `src/data/initiatives.ts`, gränssnittet i `src/components/Bidra.tsx` och kartan i `src/components/InitiativeMap.tsx`.

Kontrollera och bygg:

```bash
npm test
npm run typecheck
npm run build
```

Bygget förrenderar startsidan i `dist/client/`. Sites publicerar dessa statiska filer; `.openai/hosting.json` anger kopplingen till webbplatsen. `dist/server/` används för förrenderingen och ingår inte i den statiska publiceringen.

Ingen API-nyckel behövs. Kartan hämtar en extern CARTO/OpenStreetMap-bakgrund och kräver WebGL. Sökningen är lokal och bygger på ord, kategorier och ett litet ortregister. Sparade initiativ finns bara på den egna enheten.

TanStack Intent är konfigurerat för `@tanstack/*`. Se AGENTS.md för laddning av versionsbundna agentfärdigheter. Ingen AI-insamling, vektordatabas, betalning eller uppföljning av faktiska donationer har implementerats ännu.

Fotografierna är illustrativa och licensierade via Unsplash. Se [bildkällor](docs/ASSETS.md).
