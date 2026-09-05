# Bidra – MVP och första prototyp

Datum: 5 september 2026. Namnet är **Bidra**. Svenska är primärt språk och Sverige är första geografiska område. Den tidigare benämningen aidmap är ersatt.

## Syfte

Göra det lättare för någon som vill bidra till allmännytta att hitta en konkret, begriplig väg från hjärtefråga till handling. Besökaren ska förstå vad arbetet gäller, var det hör hemma, hur en gåva används enligt organisationen och vilka källor som ligger bakom informationen.

Bidra förmedlar information och länkar till organisationernas egna sidor. Tjänsten tar inte emot, fördelar eller bekräftar betalningar.

## Riktning och ton

Vit bakgrund, skogsgrönt, ljusa gröna accenter, luftig typografi och fotografier av levande natur och gemenskap. Allt livs egenvärde, omsorg, delaktighet och hopp informerar känslan. Besökaren väljer sin hjärtefråga själv. Undvik skuldbeläggande budskap, falsk brådska, konkurrens mellan livsformer och ogrundade effektlöften.

Referenserna inspirerar samspelet mellan kort, karta och detaljer. Den bifogade ideologin används som gestaltningsunderlag, inte som instruktion att publicera manifestet eller prioritera en viss politisk organisation.

## Byggt i första prototypen

- TanStack Start, React, TypeScript och Vite, skapade med TanStacks aktuella CLI. Agentfärdigheter från TanStack finns tillgängliga genom Intent och AGENTS.md.
- Svensk sökruta, sex hjärtefrågor och en guide i två steg.
- Ett manuellt urval av åtta initiativ/insatser från sex organisationer. Tre skogsinsatser kommer från samma organisation och ska inte räknas som tre olika aktörer.
- MapLibre GL JS med Sverige i startvyn; kort och markörer följer samma filter. Panorering, zoom, återställning och förklaring av geografisk placering.
- Detaljpanel med organisation, sammanfattning, användning av stöd, källa, datum för läst källa och länk vidare.
- Filter för pengar, tid och lokala insatser; relevans eller organisationsnamn som sortering.
- Bokmärken i besökarens webbläsare, tydligt märkta som sparade på den egna enheten. Inget konto eller synkronisering.
- Mobil vy med växling mellan lista och karta, tangentbordsstöd, fokus i dialoger och reducerad rörelse.
- Tillstånd för tomma resultat, otillgänglig lagring och kartfel.

Prototypens sökning använder svenska ord, enkla kategorisynonymer och kända orter. Den är inte en AI-modell eller en generell geografisk söktjänst. Den hanterar inte alla formuleringar, negationer eller godtyckliga ortnamn. Rikstäckande initiativ kan vara relevanta vid en ortssökning men visas utan lokal nål.

## Huvudflöde

1. Besökaren skriver exempelvis ”hjälpa barn i Sverige”, väljer en kategori eller använder guiden.
2. Listan och kartan visar samma urval. Tomma resultat ger möjlighet att återställa filtren.
3. Besökaren öppnar en post, granskar geografi, beskrivning och originalkälla.
4. Besökaren går vidare till organisationen för gåva eller engagemang. Bidra registrerar inte detta som en genomförd donation.
5. Ett bokmärke gör det möjligt att återvända från samma webbläsare.

## Geografisk modell

| Koppling | Betydelse | Visning |
|---|---|---|
| Insatsplats | En identifierad skog eller annan konkret insats | Punkt eller polygon med precision och källa |
| Verksamhetsområde | Exempelvis en kommun där flera insatser sker | Ungefärlig ortspunkt i prototypen; område i kommande version |
| Rikstäckande | Arbetet berör hela Sverige | Lista och antal på kartan; ingen påhittad huvudkontorsnål |
| Huvudkontor | Juridisk eller administrativ adress | Organisationsfakta; inte standardmarkör för effekt |

Prototypens lokala koordinater är ungefärliga ort-/kommunplaceringar. Detaljerna förklarar detta. Nålen är aldrig ett påstående om exakt fördelning av en gåva. Behov och effekt får egna lager först när geografiska underlag med datum, upplösning och källa finns.

## Datamodell för nästa steg

Separera följande poster så att en aktör kan ha flera insatser och flera geografiska kopplingar:

- **Organization**: namn, organisationsnummer, officiell domän, kontakt, organisationsform.
- **Initiative**: aktör, rubrik, beskrivning, hjärtefrågor, avsikt, hur stöd används, giltighetsperiod och status.
- **GeographicConnection**: relationstyp, område/punkt, precision, källhänvisning och granskningsstatus.
- **ContributionOption**: gåva/tid/annat, officiell HTTPS-länk, villkor och senaste kontroll.
- **SourceObservation**: originaladress, hämtningstid, innehållshash, belägg och vilka fält uppgifterna stödjer.
- **TrustSignal**: exempelvis offentligt bokslut, registeruppgift eller 90-konto, med verifierande källa och datum. Ingen samlad automatisk tillitsstämpel.
- **ImpactUpdate**: vad som gjorts, rapportperiod, geografisk räckvidd, resultatmått, metod, källa och om uppgiften är självrapporterad eller oberoende.
- **Feedback**: inrapporterat sakfel/relevansproblem med moderation, inte ett popularitetsbetyg som likställs med trovärdighet.

## Trovärdighet och källor

”Källa finns” betyder att originalinformationen går att läsa. Det betyder inte att verksamheten har granskats oberoende. Datumet i prototypen avser när källan lästes, inte när ett bokslut reviderades eller effekten utvärderades. Inga insamlingsbelopp, betyg eller beräknade effekter har fabricerats.

Källorna är organisationernas egna webbplatser. Djurskyddet Skellefteås gåvosida har ett äldre uppdateringsdatum; detaljtexten ber besökaren bekräfta aktuella villkor. Nästa version behöver kontroll av länkar, sista granskningsdag per fält och synlig hantering av inaktuella poster.

## Föreslagen etappordning

### 1. Granskat svenskt register

Utöka med ett begränsat antal organisationer och ett redaktionellt administrationsflöde. Använd en relationsdatabas med geografiska fält. Bevara originalkällor och revisionshistorik. Granska identitet, geografiska kopplingar och gåvolänkar innan publicering. Inkludera demokrati och fria medier när konkreta svenska insatser har källbelägg.

### 2. Insamling med AI som hjälp

Hämta från tillåtna öppna register och officiella webbplatser i schemalagda jobb. Respektera villkor, robots-regler och begränsa hämtningstakt. Extrahera strukturerade förslag med belägg per fält, deduplicera aktörer och placera osäkra uppgifter i en granskningskö. Webbinnehåll behandlas som data, aldrig som instruktioner till systemet. Publicera inte AI-genererade koordinater eller trovärdighetsomdömen utan belägg.

### 3. Semantisk sökning

Skapa embeddings från granskade beskrivningar och kategorier; lagra modellversion och ursprungsdata. Kombinera textsökning och vektorsökning med explicita filter för geografi och sätt att bidra. Förklara träffen med relevanta fakta och källor. Utvärdera på en svensk testmängd med bland annat negation, ort, breda avsikter och frågor utanför katalogen.

### 4. Återkoppling och behovslager

Låt organisationer lägga till källbelagda verksamhetsuppdateringar som modereras. En följd organisation är inte bevis på en donation. Håll isär aktivitet, utfall och långsiktig effekt, och tillskriv inte ett resultat en enskild gåva utan metodstöd. Behovslager kräver separat utredning av datakälla, licens, datum och statistisk jämförbarhet.

Konton, delade listor, e-post och externa integrationer införs först när de behövs för dessa flöden. E-post ska vara frivillig och samtyckesbaserad.

## Teknik och avgränsningar

Den första leveransen är statiskt förrenderad med TanStack Start. Ingen databas, betalningslösning, extern AI-nyckel, insamlingsrobot eller användarautentisering behövs för själva prototypen. Vid införande av serverfunktioner behöver serverdrift och hemligheter läggas till; statisk publicering ensam kör inte serverfunktioner.

MapLibre laddas separat i webbläsaren. Bakgrundskartan kommer från CARTO/OpenStreetMap och kräver nätanslutning och WebGL. Attribuering visas i kartan. Villkor, kapacitet och lämplig leverantör ska fastställas före en publik lansering i större skala. Listan fungerar även om kartan inte kan visas.

Ett progressivt WebMCP-verktyg, `search_bidra_initiatives`, använder samma sökfunktion och uppdaterar samma gränssnitt. Det tar endast en validerad söktext. Ingen stödd WebMCP-valideringskontext har använts i leveransen, så kompatibiliteten är inte verifierad i webbläsare.

## Acceptanskriterier

- Svenskt namn, språk och startområde i hela upplevelsen.
- Varje listad post har källa, geografisk förklaring och officiell länk vidare.
- Alla filter uppdaterar både lista och markörer.
- Rikstäckande arbete får inte en missvisande lokal markör.
- Sökning och guide har ärliga tomma tillstånd; inga simulerade AI-resultat.
- Donationer hanteras endast hos organisationen.
- Manuellt urval, begränsad granskning och avsaknad av effektuppföljning framgår.
- Bygge, typkontroll och domäntester går igenom. Visuell webbläsargranskning ingår inte i denna leverans.

## Källor för teknik och innehåll

- [TanStack Start: komma igång](https://tanstack.com/start/latest/docs/framework/react/getting-started)
- [TanStack Start: statisk förrendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
- [TanStack Intent: agentfärdigheter](https://tanstack.com/intent/latest/docs/getting-started/quick-start-consumers)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Naturarvet](https://naturarvet.se/)
- [Stockholms Stadsmission](https://www.stadsmissionen.se/)
- [Håll Sverige Rent: Skräphjältar](https://hsr.se/skraphjaltar)
- [Djurskyddet Skellefteå: gåvor](https://www.djurskyddet.se/skelleftea/hjalp-djuren/gava/)
- [Bris: stöd Bris](https://www.bris.se/stod-bris/)
- [Naturskyddsföreningen: klimatgåva](https://www.naturskyddsforeningen.se/gavor/gava-till-klimatet/)
