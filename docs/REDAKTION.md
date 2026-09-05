# Redaktion och register

Öppna `/admin` på Bidra och logga in med sajtägarens konto. Behörigheten kontrolleras på servern. Att dela själva sajten ger inte automatiskt redaktörsbehörighet.

## Arbetsflöde

1. Välj en importerad post eller skapa ett nytt initiativ.
2. Fyll i organisation, kategori, geografisk beskrivning, sammanfattning, sätt att bidra och officiella HTTPS-länkar. Lokala poster behöver koordinater med beskriven precision; nationella poster visas utan kartmarkör.
3. Spara utkastet. Grundfälten måste vara ifyllda även för ett nytt utkast. En tidigare publicerad version fortsätter att synas.
4. Skicka till granskning. Läs originalkällan och kontrollera bidragslänken, identiteten, beskrivningen och geografin. Ange datum och anteckning; bekräfta de fyra kontrollpunkterna.
5. Godkänn och publicera. Den publicerade versionen uppdateras atomiskt. Redaktören kan både skriva och godkänna; detta är inte ett krav på två oberoende personer.
6. Återför till utkast eller arkivera med motivering. Arkivering tar bort posten från besökarens lista och karta men behåller historiken. Spara den som utkast igen för att återpublicera genom samma granskning.

Ändringar hämtas när besökaren laddar om sidan. Ingen direktuppdatering finns ännu. Revisionskonflikter avvisas: läs in senaste versionen innan du försöker igen.

## Lagring

`registry_entries` innehåller arbetsutkast, publicerad JSON-snapshot, status och versionsnummer. `registry_events` bevarar varje ändrings snapshot, åtgärd, intern redaktörsidentitet, anteckning och tid. Gränssnittet visar de 50 senaste händelserna; databasen behåller äldre. `registry_meta` markerar importen. En unik ändringsidentifierare förhindrar historikhändelser för en förlorad samtidig skrivning.

De åtta ursprungliga posterna importeras en gång som publicerade med sina tidigare källuppgifter. Import är inte en ny källgranskning. Inga testdata eller påhittade granskningsanteckningar läggs i produktionsdatabasen.

JSON-snapshots håller den första redaktionen liten och bevarar innehåll vid varje revision. Fristående tabeller för organisationer, källbelägg per fält, geografiska områden och uppföljning kan införas med framtida migrationer. Ingen filuppladdning, källarkivering eller automatisk webbhämtning sker.

## Drift och tillit

API:t körs bakom Sites dispatcher, som levererar betrodda inloggningsheaders. `ADMIN_EMAIL` sätts som hemlig servervariabel i Sites. Avsaknad av variabel eller identitet stänger skrivåtkomst. Historiken använder sajtens användar-ID. Mutationer kräver samma Origin, JSON och högst 32 kB data. Fält och övergångar valideras på servern. Egen drift kräver att inloggning och borttagning av förfalskade identitetsheaders löses där först.

D1 kopplas av Sites. Drizzle-migrationer paketeras med bygget och tillämpas vid publicering. Databasen lever separat från GitHub och webbplatsens byggfiler. En kodåterställning återställer inte data. Historik är inte en fristående säkerhetskopia; separat export, återställningsrutin och driftövervakning återstår inför bredare användning.

## Verifierat lokalt

Integrationstestet använder Workers/SQLite och kontrollerar behörighet, ursprungskontroll, ogiltiga länkar/koordinater/datum, dold utkastversion, godkännande, samtidiga skrivningar, arkivering, återupptaget utkast, idempotent import och atomisk rollback. Sökningens domäntester och TypeScript-kontroller ingår också. Ingen visuell webbläsargranskning har gjorts i denna ändring.
