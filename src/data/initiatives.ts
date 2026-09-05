export type Category = 'natur' | 'manniskor' | 'djur' | 'klimat' | 'hav' | 'barn'
export type Initiative = {
  id: string
  title: string
  organization: string
  category: Category
  region: string
  scope: 'local' | 'national'
  coordinates?: [number, number]
  geography: string
  summary: string
  contribution: string
  source: string
  donate: string
  image?: string
  keywords: string[]
  giving: ('pengar' | 'tid')[]
}

export const categories: { id: Category; label: string; color: string; words: string[] }[] = [
  { id: 'natur', label: 'Natur & biologisk mångfald', color: '#477d52', words: ['natur', 'skog', 'gammelskog', 'biologisk', 'mångfald', 'arter', 'ekosystem'] },
  { id: 'manniskor', label: 'Människor & gemenskap', color: '#c17b4e', words: ['människor', 'gemenskap', 'hemlös', 'fattigdom', 'mat', 'utsatt', 'måltid'] },
  { id: 'djur', label: 'Djurens rätt', color: '#9c799f', words: ['djur', 'katt', 'hund', 'djurhem', 'djurskydd', 'djurrätt'] },
  { id: 'klimat', label: 'Klimat & omställning', color: '#8f9150', words: ['klimat', 'utsläpp', 'koldioxid', 'energi', 'omställning'] },
  { id: 'hav', label: 'Hav & vatten', color: '#548aab', words: ['hav', 'vatten', 'plast', 'skräp', 'strand', 'kust'] },
  { id: 'barn', label: 'Barn & unga', color: '#bc9143', words: ['barn', 'ung', 'trygghet', 'bris', 'skola'] },
]

export const initiatives: Initiative[] = [
  {
    id: 'soderboda', title: 'Låt gammelskogen leva vidare', organization: 'Naturarvet', category: 'natur', region: 'Gräsö, Uppland', scope: 'local', coordinates: [18.52, 60.43],
    geography: 'Insatsområde på Gräsö. Markören är ungefärlig och visar inte en fastighetsgräns.',
    summary: 'Var med och bevara Söderboda gammelskog och de arter som har sitt hem där.',
    contribution: 'Gåvor hjälper Naturarvet att förvärva och långsiktigt bevara gammelskog. På organisationens sida väljer du hur du vill bidra och ser aktuella villkor för en skogsruta.',
    source: 'https://naturarvet.se/', donate: 'https://naturarvet.se/', image: '/images/forest.jpg', keywords: ['söderboda', 'gräsö', 'uppland', 'uppsala'], giving: ['pengar'],
  },
  {
    id: 'stadsmissionen', title: 'En tryggare vardag för fler', organization: 'Stockholms Stadsmission', category: 'manniskor', region: 'Stockholm', scope: 'local', coordinates: [18.068, 59.33],
    geography: 'Verksamhetsområde Stockholm. Markören representerar staden, inte en särskild mötesplats eller mottagare.',
    summary: 'Stöd måltider, mötesplatser och vägar vidare för människor som lever i utsatthet.',
    contribution: 'Stödet går till både akut hjälp och långsiktigt socialt arbete i Stockholm. Du kan också läsa om att bidra med din tid som volontär på organisationens webbplats.',
    source: 'https://www.stadsmissionen.se/', donate: 'https://www.stadsmissionen.se/', image: '/images/community.jpg', keywords: ['stockholm', 'fattigdom', 'hemlöshet', 'volontär', 'mat', 'social'], giving: ['pengar', 'tid'],
  },
  {
    id: 'skraphjaltar', title: 'Mer liv. Mindre skräp.', organization: 'Håll Sverige Rent', category: 'hav', region: 'Hela Sverige', scope: 'national',
    geography: 'Rikstäckande engagemang. Visas utan en enskild kartnål eftersom du kan delta på många platser.',
    summary: 'Bli en del av rörelsen som håller skräpet borta från våra stränder och vår natur.',
    contribution: 'Bli skräphjälte och få vägledning för att plocka skräp där du bor. Här bidrar du med tid och engagemang; anmälan och aktuell information finns hos Håll Sverige Rent.',
    source: 'https://hsr.se/skraphjaltar', donate: 'https://hsr.se/skraphjaltar', image: '/images/coast.jpg', keywords: ['sverige', 'plast', 'skräpplockning', 'volontär', 'strand', 'hav'], giving: ['tid'],
  },
  {
    id: 'djurskyddet', title: 'Ge utsatta djur en ny chans', organization: 'Djurskyddet Skellefteå', category: 'djur', region: 'Skellefteå, Västerbotten', scope: 'local', coordinates: [20.95, 64.75],
    geography: 'Lokalföreningens verksamhetsområde i Skellefteå. Markören visar orten, inte ett djurhems adress.',
    summary: 'Hjälp den lokala föreningen att ta hand om djur som behöver omsorg.',
    contribution: 'Föreningen anger att gåvor går direkt till djuren. Besök deras egen gåvosida för aktuella sätt att stödja verksamheten. Källsidan anger en äldre uppdateringsdag; bekräfta villkoren hos föreningen.',
    source: 'https://www.djurskyddet.se/skelleftea/hjalp-djuren/gava/', donate: 'https://www.djurskyddet.se/skelleftea/hjalp-djuren/gava/', keywords: ['skellefteå', 'västerbotten', 'norrland', 'katter', 'djurhem'], giving: ['pengar'],
  },
  {
    id: 'djupsjoan', title: 'En framtid för skogen i Jämtland', organization: 'Naturarvet', category: 'natur', region: 'Åre kommun, Jämtland', scope: 'local', coordinates: [13.47, 63.42],
    geography: 'Insatsområde i Åre kommun. Ungefärlig kommunplacering för Djupsjöåns gammelskog; inte exakta skogskoordinater.',
    summary: 'Bidra till Naturarvets arbete med att bevara Djupsjöåns gammelskog.',
    contribution: 'Naturarvet samlar in medel för skogsförvärv och långsiktigt skydd. Läs om Djupsjöåns gammelskog och aktuellt insamlingsläge direkt hos Naturarvet.',
    source: 'https://naturarvet.se/', donate: 'https://naturarvet.se/', image: '/images/forest.jpg', keywords: ['jämtland', 'åre', 'djupsjöån', 'norrland'], giving: ['pengar'],
  },
  {
    id: 'bris', title: 'Någon som lyssnar. Dygnet runt.', organization: 'Bris', category: 'barn', region: 'Hela Sverige', scope: 'national',
    geography: 'Bris ger stöd till barn i hela Sverige. Ingen enskild plats representerar verksamhetens effekt.',
    summary: 'Hjälp Bris att fortsätta finnas där när barn behöver prata med en kurator.',
    contribution: 'Gåvor stöder Bris arbete för barn, bland annat professionellt stöd via telefon, sms, mejl och chatt. Se organisationens egen information om ekonomi och uppföljning.',
    source: 'https://www.bris.se/stod-bris/', donate: 'https://www.bris.se/stod-bris/', keywords: ['sverige', 'barnrätt', 'psykisk hälsa', 'stöd', 'samtal'], giving: ['pengar'],
  },
  {
    id: 'ekas', title: 'Bevara en levande lövskog', organization: 'Naturarvet', category: 'natur', region: 'Gällared, Halland', scope: 'local', coordinates: [12.84, 57.12],
    geography: 'Insatsområde i Gällared socken. Markören är ungefärlig och visar inte Ekås fastighetsgränser.',
    summary: 'Ge ekar, bokar och skogens andra invånare utrymme att leva vidare.',
    contribution: 'Stöd Naturarvets arbete med Ekås ek-bokskog. Aktuell information om skogen och hur en gåva kan öronmärkas finns på Naturarvets webbplats.',
    source: 'https://naturarvet.se/', donate: 'https://naturarvet.se/', image: '/images/forest.jpg', keywords: ['halland', 'gällared', 'ekås', 'lövskog'], giving: ['pengar'],
  },
  {
    id: 'klimat', title: 'Tillsammans för ett bättre klimat', organization: 'Naturskyddsföreningen', category: 'klimat', region: 'Hela Sverige', scope: 'national',
    geography: 'Nationellt påverkansarbete med effekter även utanför Sverige. Visas utan en lokal kartnål.',
    summary: 'Stöd arbetet för en starkare klimatpolitik och mindre beroende av fossil energi.',
    contribution: 'Gåvan bidrar bland annat till klimatarbete, granskning och påverkan för hållbara energisystem. Bidra visar inga beräknade utsläppsminskningar för en enskild gåva.',
    source: 'https://www.naturskyddsforeningen.se/gavor/gava-till-klimatet/', donate: 'https://www.naturskyddsforeningen.se/gavor/gava-till-klimatet/', keywords: ['sverige', 'klimatpolitik', 'fossil', 'demokrati', 'koldioxid'], giving: ['pengar'],
  },
]

export const checkedAt = '5 september 2026'

export function normalize(value: string) {
  return value.toLocaleLowerCase('sv').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const stopWords = new Set(['jag', 'vill', 'att', 'och', 'eller', 'for', 'till', 'med', 'som', 'dar', 'det', 'den', 'ett', 'min', 'mitt', 'hjalpa', 'hjalp', 'stodja', 'stod', 'bidra', 'skanka', 'pengar', 'sverige', 'svenska'])
export function searchInitiatives(query: string, category: Category | 'all' = 'all', giving = 'all', localOnly = false): Initiative[] {
  const terms = normalize(query).split(/[^a-z0-9]+/).filter(term => term.length > 1 && !stopWords.has(term))
  const places = ['stockholm', 'skelleftea', 'grasö', 'graso', 'are', 'jamtland', 'halland', 'gallared', 'vasterbotten', 'uppland', 'uppsala', 'goteborg', 'malmo', 'umea', 'norrland']
  const requestedPlaces = terms.filter(term => places.includes(term))
  const requestedCauses = categories.filter(cat => terms.some(term => cat.words.some(word => term.startsWith(normalize(word)))))
  const filtered = initiatives.filter(item => {
    const location = normalize([item.region, ...item.keywords].join(' '))
    return (category === 'all' || item.category === category) && (giving === 'all' || item.giving.some(mode => mode === giving)) && (!localOnly || item.scope === 'local')
      && (!requestedPlaces.length || item.scope === 'national' || requestedPlaces.some(place => location.includes(place)))
      && (!requestedCauses.length || requestedCauses.some(cause => cause.id === item.category))
  })
  if (!terms.length) return filtered
  return filtered.map(item => {
    const cat = categories.find(c => c.id === item.category)!
    const haystack = normalize([item.title, item.organization, item.summary, item.region, ...item.keywords, ...cat.words].join(' '))
    const score = terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0) + (requestedCauses.some(c => c.id === item.category) ? 1 : 0)
    return { item, score }
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).map(result => result.item)
}
