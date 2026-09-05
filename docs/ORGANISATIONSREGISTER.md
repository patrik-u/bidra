# Organisationsregister och stående stöd

Infört 2026-09-05. Grundurvalet innehåller 30 organisationer med svenska
gåvovägar. Det är varken ett fullständigt register eller en kvalitetsranking.
Källor och egna korta beskrivningar finns i `server/organization-seed.mjs`.
Organisationernas bilder och längre texter kopieras inte.

## Innehåll och aktualitet

- `bidrakartan.organization.v1` är en **appdefinierad** Content-typ i Vibe
  Cloud. Den innehåller officiella länkar, verksamhetsområde, granskningsdatum
  och relationer till initiativ. Interna anteckningar publiceras aldrig.
- `standingInitiativeId` pekar ut organisationens stående stöd. Övriga poster
  i `initiativeIds` kan vara särskilda insatser, kampanjer eller evenemang.
  Befintliga initiativ använder oförändrat `vibe.initiative.v1`; dess
  registrerade schema är oföränderligt och får inte ändras på plats.
- En stående gåvomöjlighet försvinner inte på grund av en gammal
  publiceringsdag. Granska beskrivning, identitet och gåvoväg minst var
  tredje månad. `verifiedAt` ändras av redaktören, aldrig av en HTTP-kontroll.
- Nationellt och internationellt stöd kan hittas i listan utan en påhittad
  kartnål vid huvudkontoret. `scope: national` är här det befintliga tekniska
  värdet för stöd utan en enskild lokal kartposition. Region och beskrivning
  anger var arbetet faktiskt gör nytta.
- Att avpublicera initiativet under **Initiativ** tar bort gåvokortet från
  sajten. Organisationsregistret återskapar eller återpublicerar det inte.

## Redaktion

**Organisationer** visar alla registrerade organisationer, datum för nästa
innehållsgranskning, senaste länkkontroll och kopplade initiativ. Redaktörer
kan lägga till och ändra organisationer samt välja stående stöd och andra
initiativ. Ändringar använder Clouds medlemskontroll och versionskonflikter.

Organisationens gåvolänk är ett granskningsunderlag. Ändra även själva
initiativets gåvolänk när det behövs; gränssnittet flaggar skillnader. En
organisationsändring skriver aldrig över en redaktionell initiativtext.

## Kontroller i bakgrunden

Fly-processen kontrollerar varje publicerad organisations gåvolänk högst en
gång per vecka, eller vid ändrad URL. Schemaläggaren vaknar varje timme;
senaste kontrollen ligger beständigt i `/data/organizations.sqlite`.

Kontrollen läser robots.txt och använder HEAD på gåvosidan. Endast
förhandsgodkända värdar får kontaktas, även vid omdirigering. Nya värdar
kräver tillägg i `server/organization-seed.mjs` innan automatisk kontroll kan
ske. Timeout, blockering, robots-regler och HTTP-fel ger en redaktionell
markering, aldrig automatisk avpublicering. Ett HTTP 200 visar enbart att
adressen svarar: det bevisar inte att innehåll eller donationsvillkor är
oförändrade. Två källor blockerade HEAD vid införandet; se
`cloud/organization-link-review.json`.

## Införande och återkörning

1. Kör `node scripts/export-cloud-registration.mjs` och synkronisera den
   registrerade appens definition till Clouds `config/apps.json`.
2. Validera med Clouds vanliga AppSpaces-motor och publicera Cloud-konfigurationen.
3. `scripts/seed-organizations.mjs` är en operatörskörning på Cloud-värden.
   Den använder en bundle av värdens befintliga AppSpaces-klass, inte SQL-
   genvägar. Kör utan flagga för förhandsvisning och med `--apply` för att
   skapa och publicera det granskade grundurvalet. Skriptet förutsätter
   `app-spaces-operator.mjs` och `organization-seed.mjs` bredvid sig.
4. Befintliga organisationer och initiativ ändras aldrig av återkörning.
   Delvis slutförda poster efter ett avbrott måste kontrolleras i redaktionen;
   återkörningen återpublicerar inte gamla utkast eller avpublicerade kort.

Varken nya API-nycklar eller generell publiceringsrätt ges till RSS-jobbet.
Bootstrap använder normala schema-, medlems-, kvot- och historikkontroller
med en separat operatörsaktör i historiken.

## Fortsatt arbete

Detta införande ger katalogens stabila grund. Det crawlar inte automatiskt
alla organisationers kampanjer. RSS-insamlingen från Naturarvet och
Naturskyddsföreningen fortsätter separat, med samma granskningsflöde som
tidigare. Nästa utbyggnad är källspecifika kopplingar för kampanjer,
automatisk innehållsjämförelse, explicit livscykel för tidsbegränsade
möjligheter och innehållsanpassade bilder. Sådana bilder behöver budget och
tydlig märkning som illustrationer, inte dokumentära verksamhetsbilder.
