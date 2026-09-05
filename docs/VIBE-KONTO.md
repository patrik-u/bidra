# Vibe-konto i Bidra

Bidra använder Vibe Cloud för profil och privata sparade initiativ. Utforskning
och sparande på enheten fungerar utan Vibe-konto. Inloggningen går till
`https://console.vibecloud.se` i samma flik och återvänder till
`/vibe-callback/`. Returadressen undviker Sites reserverade `/callback`.

SDK 0.1.4 finns som versionslåst paket i `vendor/`. Det hanterar PKCE, kontroll
av signerad identitet, åtkomsttoken och roterande förnyelsetoken. Bidra hanterar
inte lösenord eller identitetsnycklar. SDK:s åtkomsttoken ligger per flik,
förnyelsetoken i webbläsarens lokala lagring. Detta är samma webbläsarmodell
som Vibe Notes; det är inte en serverbaserad Bidra-session.

Cloud avgränsar `bookmarks` till personens konto och Bidras exakta origin.
Samtidiga ändringar använder versionsvillkor; vid konflikt hämtas aktuell lista
och den avsedda tilläggs-/borttagningsoperationen provas igen. Fokus på fliken
hämtar listan på nytt. Enhetens gamla bokmärken kopieras endast med användarens
uttryckliga knapptryckning. Kontots bokmärken kopieras inte till gästlagringen.

Utloggning rensar den lokala kontosessionen och försöker återkalla dess token.
Misslyckad återkallning visas tydligt. All åtkomst för Bidra kan återkallas under
Connected apps i Cloud. Redaktionens befintliga serverkontroll via Sites och
ADMIN_EMAIL är separat och ändras inte av Vibe-inloggning.

Cloud-piloten finns i `codex/bidra-pilot`, baserad på den faktiska
produktionsgrenen `codex/calendar-feed-production`, inte det äldre lokala main.
Den registrerar Bidra och begränsar värden till konfigurerade appar, samtidigt
som Notes, Calendar, Feed och credential-demot behålls. Appgemensamt innehåll,
editorroller i Cloud, semantisk sökning och allmän lagringskvot ingår inte här.

## Kontroll

`npm run typecheck`, `npm test`, `npm run test:api`,
`npm run test:bookmarks` och `npm run build`.
Cloud har separata tester för SDK-returflöde, två konton, två sessioner,
versionskonflikter, återkallning och felaktiga token utan databasallokering.
Dessa simulerar webbläsargränsen; de ersätter inte ett faktiskt mobiltest.

Manuell acceptans: logga in, spara ett initiativ, logga in på en annan enhet och
kontrollera listan. Kontrollera därefter borttagning, utloggning och återkallning
i Cloud. Webbplatsens nuvarande privata Sites-åtkomst gäller fortfarande;
Vibe-inloggning gör inte webbplatsen offentlig.

Lokalt kan `VITE_VIBE_ORIGIN` väljas vid bygg/start. Lägg motsvarande Bidra-origin
i Clouds `VIBE_BIDRA_ORIGINS`; använd olika portar för Cloud och Bidra.

Popupen öppnas direkt vid klicket och återanvänds av SDK:t. Bidra kontrollerar returmeddelandets origin, fönster och state genom SDK:t. Om fönstret blockeras eller flödet avbryts erbjuds ett uttryckligt alternativ i samma flik. Webbläsaren avgör om ett separat fönster eller en flik visas, särskilt på mobil.

Popupreturen accepterar båda varianterna av avslutande snedstreck. Ett separat, slumpmässigt namngivet same-origin-meddelande gör att ursprungsfliken kan slutföra PKCE-utbytet även när webbläsaren isolerar fönstren. Endast engångskoden skickas; kontots token stannar i ursprungsfliken. Användaren kan avbryta väntan från Bidra.
