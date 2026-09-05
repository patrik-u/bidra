# Bilder för publicerade initiativ

Bildordningen är: manuellt bildval, innehållets egen bild, officiell
sidförhandsvisning (`og:image`), och sist en märkt AI-illustration.
Officiella förhandsvisningar kontrolleras ungefär varje vecka, inom det
timvisa bildjobbet och endast från granskade organisations-/källursprung.
De laddas från källans server/CDN med källangivelse och utan inloggningsheader.
Ingen generell rätt att återpublicera eller återlicensiera bilder påstås.
En förhandsvisning kan vara en logotyp, inte nödvändigtvis ett fotografi.
Trasiga bilder får en enkel organisationsplatshållare. Unsplash är inte
integrerat i denna version.

Återstående publicerade initiativ utan bild upptäcks varje timme, oavsett om de
kommer från organisationsregistret, insamlingen eller har skapats för hand.
Bildkön arbetar med högst två samtidiga anrop till appens befintliga
OpenAI-tjänst i Vibe Cloud. Samma månadsgräns gäller som för RSS-bilder.

Motivet bygger på initiativets rubrik, organisation, kategori, beskrivning,
bidragsmöjlighet och geografi. Bildreglerna under AI-regler används också.
Jobbet använder inte ett extra textanrop. Grundmotivet eftersträvar vardaglig,
återhållsam miljö och naturligt ljus, utan filmisk glans. Bilderna ska vara illustrationer
av ämnet, inte påstådda foton från organisationens verkliga verksamhet.
Kort och detaljvy märker genererade bilder som AI-illustrationer.

## Redaktion → Bilder

- Se vilka kort som har bild, vilka som väntar och vilka som misslyckats.
- Ange en egen motivinstruktion och skapa eller generera om bilden.
- Den tidigare bilden visas tills den nya är klar.
- Välj en tidigare bild igen utan nya API-anrop.
- Återgå till innehållets originalbild eller välj att visa kortet utan bild.
- Manuella bildval stoppar automatisk ersättning. Versionskontroll gör att
  ett pågående bildjobb inte skriver över ett senare manuellt val.

Gränssnittet visar publicerade initiativ. Bilder för privata RSS-förslag
hanteras som tidigare i granskningskön. Inga texter eller publiceringsbeslut
ändras av det nya bildjobbet.

## Beständig lagring och publicering

Cloud sköter OpenAI-nyckel, anropsgräns och generering. JPEG-filer ligger på
Bidrakartans befintliga Fly-volym under `/data/images`. Bildval och kö ligger
i `/data/initiative-images.sqlite`. Detta är ett separat presentationslager
ovanpå publicerade Content-poster, inte en ändring av Clouds Content-schema.
En Cloud-export ensam omfattar därför inte dessa filer eller bildval; även
Bidrakartans `/data` behöver säkerhetskopieras.

Filnamn bygger på innehållshash. Filerna återanvänds och ligger kvar mellan
driftsättningar. Bilder serveras anonymt endast när de används av ett
aktuellt publicerat kort; övriga bilder kräver redaktörsåtkomst.

Ett fingeravtryck av underlaget hindrar att en bild som skapats för en äldre
beskrivning automatiskt används till ändrat innehåll. Manuella bildval
återappliceras vid behov uttryckligen från historiken. Befintliga bilder i
Content utlöser inte automatisk generering.

## Fel och kostnadsgränser

Köplatsen sparas innan ett betalt anrop skickas. Avbrutna eller misslyckade
anrop görs inte om automatiskt; de kan redan ha kostat pengar. Övriga jobb
pausas efter ett tjänstefel tills redaktören väljer Fortsätt kön.

Vid Clouds HTTP 429 väntar kön en timme och kontrollerar gränsen igen. Cloud
reserverar anrop före leverantörsanropet, så även osäkra utfall omfattas av
månadsgränsen. Gränsen höjs aldrig av Bidrakartan.

Bildbiblioteket är begränsat till 64 MiB och varje ny bild till 4 MiB.
Även lagringsfel pausar kön. Den här versionen har ingen automatisk rensning
av bildhistorik, och ingen uppladdning av egna fotografier.

Verifiering: `node --test tests/initiative-images.test.mjs tests/fly.test.mjs`
samt `npx tsc --noEmit` och `npm run build`.
