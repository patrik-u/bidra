// Editorial starting selection, not a rating or a complete register of Swedish charities.
// Each URL is an official giving/support page. Text is our own short summary.
const rows = [
  ['djurens-ratt','Djurens Rätt','djur','Sverige och internationellt','https://stod.djurensratt.se/gava','Stöd arbetet för djurs rättigheter och bättre villkor för djur.','djurrätt, djurfabriker, djurförsök, päls'],
  ['civil-rights-defenders','Civil Rights Defenders','manniskor','Internationellt','https://crd.org/sv/ge-en-gava/','Stöd människorättsförsvarare och arbetet för demokrati och mänskliga rättigheter.','demokrati, frihet, mänskliga rättigheter'],
  ['greenpeace','Greenpeace','klimat','Sverige och internationellt','https://www.greenpeace.org/sweden/agera/','Bidra till arbetet för klimatet, haven och den biologiska mångfalden.','miljö, klimat, hav, skog'],
  ['unicef','UNICEF Sverige','barn','Internationellt','https://unicef.se/stod-oss','Stöd barns tillgång till vård, utbildning, rent vatten och skydd runt om i världen.','barnrätt, hälsa, skola, vatten'],
  ['lakare-utan-granser','Läkare Utan Gränser','manniskor','Internationellt','https://lakareutangranser.se/akut/ge-en-gava','Bidra till medicinsk hjälp för människor i krig, katastrofer och andra kriser.','sjukvård, medicin, humanitärt, katastrof'],
  ['roda-korset','Svenska Röda Korset','manniskor','Sverige och internationellt','https://www.rodakorset.se/skank-pengar/ge-en-gava/','Stöd humanitär hjälp till människor som drabbas av kriser och katastrofer.','nödhjälp, kris, humanitärt'],
  ['svenska-freds','Svenska Freds','manniskor','Sverige och internationellt','https://stod.svenskafreds.se/gava/~se-min-donation','Bidra till arbetet för fred, nedrustning och fredliga sätt att hantera konflikter.','fred, nedrustning, konfliktförebyggande'],
  ['radda-barnen','Rädda Barnen','barn','Sverige och internationellt','https://www.raddabarnen.se/skank-pengar/','Stöd arbetet för barns trygghet och rättigheter, i vardagen och i kriser.','barnrätt, trygghet, skydd'],
  ['stockholms-stadsmission','Stockholms Stadsmission','manniskor','Stockholm','https://www.stadsmissionen.se/ge-stod/privatperson','Stöd socialt arbete för människor som lever i utsatthet i Stockholm.','hemlöshet, fattigdom, gemenskap, stockholm','stadsmissionen'],
  ['goteborgs-stadsmission','Göteborgs Stadsmission','manniskor','Göteborg','https://www.stadsmissionen.org/ge-en-gava-for-att-du-kan/','Bidra till stöd för människor i utsatthet i Göteborg.','hemlöshet, fattigdom, gemenskap, göteborg'],
  ['wwf','WWF','natur','Sverige och internationellt','https://www.wwf.se/stod/ge-en-gava/','Stöd arbetet för biologisk mångfald, hotade arter och levande natur.','arter, biologisk mångfald, naturvård'],
  ['naturskyddsforeningen','Naturskyddsföreningen','natur','Sverige och internationellt','https://www.naturskyddsforeningen.se/stod-oss/ge-en-gava/gava-till-naturen/','Bidra till arbetet för natur, miljö och en hållbar framtid.','skog, miljö, klimat, biologisk mångfald'],
  ['sos-barnbyar','SOS Barnbyar','barn','Internationellt','https://sos-barnbyar.se/vad-du-kan-gora/','Stöd barn som saknar eller riskerar att förlora föräldrars omsorg.','familj, omsorg, trygghet'],
  ['unhcr','Sverige för UNHCR','manniskor','Internationellt','https://www.sverigeforunhcr.se/stod-oss/ge-en-gava/','Bidra till skydd och nödhjälp för människor som tvingats fly.','flyktingar, flykt, skydd, nödhjälp'],
  ['plan','Plan International Sverige','barn','Internationellt','https://plansverige.org/stod-barnen/ge-bort-gavobevis/gava-for-akuta-insatser','Stöd akuta insatser för barn genom Plans gåvobevis.','flickor, barnrätt, katastrof, skydd'],
  ['bris','Bris','barn','Hela Sverige','https://www.bris.se/stod-bris/','Bidra till att barn kan få stöd och prata med en kurator.','barnrätt, psykisk hälsa, samtal','bris'],
  ['barncancerfonden','Barncancerfonden','barn','Hela Sverige','https://www.barncancerfonden.se/jag-vill-bidra/ge-en-gava/','Stöd forskning om barncancer och stöd till drabbade barn och familjer.','barncancer, forskning, familj'],
  ['cancerfonden','Cancerfonden','manniskor','Hela Sverige','https://www.cancerfonden.se/gavoshop/privat','Bidra till cancerforskning genom en gåva eller ett gåvobevis.','cancer, forskning, hälsa'],
  ['hjart-lungfonden','Hjärt-Lungfonden','manniskor','Hela Sverige','https://www.hjart-lungfonden.se/stod-oss/gava/','Stöd forskning om hjärt- och lungsjukdomar.','hjärta, lunga, forskning, hälsa'],
  ['mind','Mind','manniskor','Hela Sverige','https://mind.se/stod-oss/sa-kan-du-bidra/ge-en-gava/','Bidra till Minds arbete för psykisk hälsa och medmänskligt stöd.','psykisk hälsa, ensamhet, samtal'],
  ['suicide-zero','Suicide Zero','manniskor','Hela Sverige','https://suicidezero.se/stod-oss/ge-en-gava/','Stöd arbetet för att förebygga självmord genom kunskap och förändring.','suicidprevention, psykisk hälsa'],
  ['kvinna-till-kvinna','Kvinna till Kvinna','manniskor','Internationellt','https://kvinnatillkvinna.se/gava/','Stöd kvinnors rättigheter och kvinnorättsorganisationer i konfliktområden.','kvinnor, jämställdhet, fred, rättigheter'],
  ['majblomman','Majblomman','barn','Hela Sverige','https://majblomman.se/stod-oss/bli-manadsgivare/','Bli månadsgivare och stöd arbetet mot barnfattigdom i Sverige.','barnfattigdom, ekonomiskt stöd'],
  ['erikshjalpen','Erikshjälpen','barn','Sverige och internationellt','https://erikshjalpen.se/ge-en-gava/','Stöd barns rätt till utbildning, hälsa, trygghet och skydd.','utbildning, barnrätt, hälsa'],
  ['wateraid','WaterAid','hav','Internationellt','https://www.wateraid.org/se/ge-en-gava','Bidra till tillgång till rent vatten, toaletter och hygien.','dricksvatten, sanitet, hygien'],
  ['actionaid','ActionAid Sverige','manniskor','Internationellt','https://actionaid.se/product-category/gava/','Stöd arbetet för flickors och kvinnors rättigheter genom en gåva.','flickor, kvinnor, jämställdhet'],
  ['diakonia','Diakonia','manniskor','Internationellt','https://www.diakonia.se/stod-oss/ge-en-gava/','Bidra till arbetet för mänskliga rättigheter och mot fattigdom och förtryck.','rättigheter, demokrati, fattigdom'],
  ['act-svenska-kyrkan','Act Svenska kyrkan','manniskor','Internationellt','https://www.svenskakyrkan.se/act/ge-en-gava/privatperson','Stöd humanitära insatser och långsiktigt arbete mot fattigdom och orättvisor.','humanitärt, fattigdom, rättvisa'],
  ['hundstallet','Hundstallet','djur','Hela Sverige','https://hundstallet.se/stod-oss/','Bidra till omsorg och nya hem för hundar som behöver hjälp.','hundar, djurhem, omplacering'],
  ['naturarvet','Naturarvet','natur','Hela Sverige','https://naturarvet.se/','Stöd förvärv och långsiktigt bevarande av gammelskog i Sverige.','gammelskog, skog, biologisk mångfald'],
]

export const organizationSeed = rows.map(([slug,name,category,region,donate,summary,words,existingId]) => ({
  id: `org-${slug}`, existingId,
  organization: {name, website:new URL(donate).origin+'/', donate, region, verifiedAt:'2026-09-05', reviewDueAt:'2026-12-04', initiativeIds:[], notes:'Grundurval från officiella stöd- och gåvosidor. Ingen oberoende effektbedömning. Granska innehåll och gåvoväg minst var tredje månad.'},
  initiative: {title:`Stöd ${name}`,organization:name,category,region,scope:'national',
    geography: region==='Internationellt' || region==='Sverige och internationellt' ? 'Gåvomöjlighet via organisationens svenska webbplats. Stödet kan användas internationellt och visas utan en lokal kartnål.' : `Stödet avser ${region}. Det är inte knutet till en enskild besöksplats och visas därför utan kartnål.`,
    summary,contribution:`${summary} På organisationens egen sida hittar du aktuella gåvoalternativ och villkor. Detta är en stående möjlighet att stödja arbetet, utan angivet slutdatum.`,source:donate,donate,keywords:words.split(', '),giving:['pengar']},
}))

// Existing reviewed records are linked, never overwritten by this bootstrap.
export function planOrganizationSeed(seed, organizations, initiatives) {
  const orgIds=new Set(organizations.map(item=>item.entityId))
  const initiativeIds=new Set(initiatives.map(item=>item.entityId))
  return seed.filter(item=>!orgIds.has(item.id)).map(item=>{
    const id=item.existingId && initiativeIds.has(item.existingId) ? item.existingId : `standing-${item.id.slice(4)}`
    const related=initiatives.filter(doc=>doc.payload.organization===item.organization.name).map(doc=>doc.entityId)
    return {...item,initiativeId:id,createInitiative:!initiativeIds.has(id),organization:{...item.organization,standingInitiativeId:id,initiativeIds:[...new Set([id,...related])]}}
  })
}
