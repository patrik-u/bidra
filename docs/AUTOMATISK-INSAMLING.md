# Automatisk insamling och semantisk sökning

Infört 2026-09-05. Målet är en levande karta med konkreta gåvor och aktiva
tidsinsatser, med så lite manuell administration som möjligt.

## Källor och intervall

| Källa | Urval | Normalt intervall |
|---|---|---|
| Naturarvet | Aktuella gammelskogar från startsidan; redan skyddade undantas | 6 timmar |
| Naturskyddsföreningen Göteborg | RSS, därefter aktiv insatskontroll | 6 timmar |
| UNICEF Sverige | Riktade hjälpsidor i katastrofkatalogen | 6 timmar |
| Röda Korset | Riktade insamlingssidor länkade från gåvokatalogen | 6 timmar |
| Röda Korset, volontärer | Aktuella uppdrag från volontärkatalogen | 6 timmar |

Adaptrar och urval finns i `server/collection-sources.mjs`. Källan kan pausas i
Redaktion → Automatisk insamling. Det är fem källor från fyra organisationer;
det är inte en heltäckande bevakning av alla organisationer i registret.
Stående organisationsstöd fortsätter att visas tillsammans med aktuella insatser.

En arbetare startar vid serverstart och varje timme. Nästa källkontroll sparas
i SQLite, så en omstart gör inte automatiskt om all hämtning. Högst 12 sidor
per källa hämtas per källkörning och högst 12 AI-bedömningar behandlas per
arbetarkörning. Äldst kontrollerade sidor prioriteras. En stor kö töms över
flera timmar. Källfel försöks igen tidigast nästa timme.

Hämtaren respekterar robots-regler, tillåter bara respektive granskade ursprung,
begränsar svar till 2 MiB och har tidsgränser. Endast korta egna sammanfattningar,
källhänvisningar och relevanta metadata publiceras. Adaptrar måste ses över om
en organisation ändrar webbplatsstruktur eller villkor.

## Beslut och publicering

1. Normaliserad webbadress ger stabil identitet; spårningsparametrar och
   avslutande snedstreck skapar inte nya poster. Befintliga Naturarvet-objekt
   har uttryckliga alias så de inte dubblas.
2. Sidans huvudtext och observerade länkar skickas till appens AI-tjänst i
   Vibe Cloud. Källtext behandlas som data, aldrig som instruktioner.
3. Modellen väljer rekommenderad, osäker eller bortsorterad. Automatik kräver
   bland annat ett exakt källcitat, en observerad tillåten bidralänk, konkret
   gåva/tidsinsats, sammanfattning och modellens säkerhetsvärde minst 0,90.
   Det värdet är modellens uppskattning, inte en garanterad träffsäkerhet.
4. Nyheter med generell gåvoknapp blir inte egna kampanjer. Passiva möten,
   bokcirklar och utflykter sorteras bort utan konkret aktiv insats. Händelser
   behöver belagt slutdatum; löpande volontäruppdrag kan sakna slutdatum.
5. Tydliga träffar sparas och publiceras automatiskt som appens egen typ
   `bidrakartan.opportunity.v1` i Cloud. Osäkra går till **Att granska**,
   övriga till **Bortsorterade**. Alla har motivering och källunderlag.

Redaktören kan publicera, dölja, återta till granskning eller begära ny
AI-bedömning. Manuella beslut skyddas även i Clouds revisionshistorik: en
service får inte skriva över innehåll som en människa har tagit över.
En ny AI-bedömning upphäver därför inte automatiskt Clouds skydd; publicera
manuellt om du vill återta ett sådant objekt. Versionskontroll förhindrar
överskrivning från en gammal redaktionsvy.

AI-regler kan ändras generellt och per källa. Aktiverad regelversion sparas
med bedömningen. Ändringar gäller framtida eller uttryckligen ombedömda
förslag. Hela instruktionerna behålls; om de blir långa minskas källunderlaget.
Extremt långa instruktioner utan tillräckligt underlag ger ett synligt fel.
Fasta kontroller av länkar, citat och källurval gäller även vid egna regler.

Källändringar leder till ny bedömning. Passerade slutdatum och upprepade
saknade källsidor kan avpublicera automatiskt ägda poster. Avpublicering
raderar inte historiken. Manuellt ägda poster kräver fortsatt redaktionellt ansvar.

## Geografi och bilder

Endast uttryckligen angivna, entydiga ortnamn matchas mot lokala GeoNames-data.
Nålen visar ungefärlig ort, inte besöksadress. Oklara platser och internationella
insatser visas i listan utan fabricerad svensk position. Kartnålar visar
kategoriikon; hover visar kort och klick öppnar detaljvyn med synlig bidraknapp.

Officiella sidförhandsvisningar prioriteras före AI-bilder. Se
[bildhanteringen](BILDGENERERING.md). De gamla AI-bilderna raderas inte, och
alla gamla motiv är inte omgenererade med den nya återhållsamma instruktionen.

## Semantisk sökning

Endast publicerat innehåll indexeras. Bidrakartan använder Clouds generiska
embedding-anrop med `text-embedding-3-small`, 512 dimensioner. Detta återanvänder
Clouds befintliga embedding-leverantör och appens krypterade OpenAI-konfiguration.
Själva appindexet ligger tills vidare i Fly, inte i ett nytt appspecifikt
semantiskt nätverk i Cloud.

Ändrade texter får nya vektorer; oförändrade återanvänds. Indexjobbet kör varje
timme med högst 40 nya poster. Sökresultat jämförs alltid med aktuellt publicerad
version, så borttaget eller ändrat innehåll inte återkommer från gamla vektorer.
Ordmatchning kombineras med semantisk likhet. Utan fungerande AI används ordsökning.

Sökfrasen skickas till OpenAI via Cloud. Ingen kontoidentitet eller GPS-position
följer med. Lokalt cachas en hash av frasen och dess vektor i sju dagar, inte
frasen i klartext. Nya fraser begränsas till en per 12 sekunder för hela tjänsten,
20 per dygn och 100 per kalendermånad i denna pilot. Cachade fraser kan fortsätta
användas. Gränserna gör att semantisk sökning inte alltid används vid hög trafik.

## Drift, kostnad och begränsningar

- `INTAKE_ENABLED=true` och en Fly-hemlighet för `CLOUD_SERVICE_TOKEN` krävs.
- Cloud har uttrycklig servicebehörighet för den nya publicerbara typen;
  inte generell rätt att skriva över andra typer eller mänskliga beslut.
- Textanalys och embeddings delar appens befintliga textkvot. Bilder har
  separat bildkvot. Inga kvoter höjdes för detta arbete.
- Bedömningen sparas innan Content skrivs. Återförsök efter osäkert skrivsvar
  återanvänder identitet och version, inte ett nytt AI-anrop eller ny post.
- Högst tre försök görs vid bearbetningsfel. Avbrutna betalda anrop vid omstart
  markeras för kontroll i stället för att upprepas tyst.
- Kön har tak på 500 förslag och ännu ingen automatisk historikrensning.
  Bildlagring har sitt eget tak. Följ fel och köstorlek i redaktionen.
- Kör en enda Fly-instans. Jobbspärren är processlokal, inte en distribuerad
  låstjänst. Skala inte ut bakgrundsarbetaren utan att införa en gemensam lease.
- Säkerhetskopiera `/data` inklusive `collection.sqlite`, `rules.sqlite`,
  `semantic.sqlite`, `initiative-images.sqlite` och bildfiler, samt Cloud-data.
- En timvis Codex-kontroll under första natten är tillfällig. Den ordinarie
  insamlingen kör på Fly och är oberoende av Codex eller användarens dator.

Tester: `npm run test:server`. De täcker bland annat deduplicering, robots,
källcitat, reglernas storlek, godkända ansökningslänkar, manuella beslut,
återstart, idempotent publicering och sökning mot aktuell publicerad version.
