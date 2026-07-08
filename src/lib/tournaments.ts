// Turnier-Daten + Saison-/Budget-Logik für den "Saison planen"-Tab auf /map.
// Kuratierter, realistischer Tour-Kalender (2026). Keine externe API nötig.

export type Surface = "Sand" | "Hartplatz" | "Rasen";
export type Tier =
  | "GS"
  | "ATP1000"
  | "ATP500"
  | "ATP250"
  | "CH125"
  | "CH100"
  | "CH75"
  | "CH50"
  | "ITF25"
  | "ITF15";

export type Tournament = {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  tier: Tier;
  surface: Surface;
  indoor: boolean;
  start: string; // ISO
  end: string; // ISO
  url?: string; // offizielle Seite (aus DB/Sync)
  prize?: number; // Sieger-Preisgeld EUR (aus DB/Sync)
};

// Punkte je Runde [Sieger, Finale, HF, VF, AF] + Preisgeld (Sieger, EUR) + Farbe + Kürzel
export const TIER_META: Record<
  Tier,
  { label: string; short: string; group: "GS" | "ATP" | "Challenger" | "ITF"; points: number[]; prize: number; color: string }
> = {
  GS: { label: "Grand Slam", short: "GS", group: "GS", points: [2000, 1300, 800, 400, 200], prize: 2200000, color: "#0f172a" },
  ATP1000: { label: "ATP Masters 1000", short: "M1000", group: "ATP", points: [1000, 650, 400, 200, 100], prize: 900000, color: "#b45309" },
  ATP500: { label: "ATP 500", short: "500", group: "ATP", points: [500, 330, 200, 100, 50], prize: 420000, color: "#7c3aed" },
  ATP250: { label: "ATP 250", short: "250", group: "ATP", points: [250, 165, 100, 50, 25], prize: 110000, color: "#2563eb" },
  CH125: { label: "Challenger 125", short: "CH125", group: "Challenger", points: [125, 75, 45, 22, 11], prize: 21600, color: "#ea580c" },
  CH100: { label: "Challenger 100", short: "CH100", group: "Challenger", points: [100, 60, 36, 18, 9], prize: 14400, color: "#ea580c" },
  CH75: { label: "Challenger 75", short: "CH75", group: "Challenger", points: [75, 44, 25, 12, 6], prize: 10800, color: "#f97316" },
  CH50: { label: "Challenger 50", short: "CH50", group: "Challenger", points: [50, 28, 16, 8, 4], prize: 7200, color: "#f97316" },
  ITF25: { label: "ITF M25", short: "M25", group: "ITF", points: [25, 16, 10, 5, 2], prize: 3600, color: "#64748b" },
  ITF15: { label: "ITF M15", short: "M15", group: "ITF", points: [15, 10, 6, 3, 1], prize: 2160, color: "#94a3b8" },
};

export const ROUND_LABELS = ["Sieger", "Finale", "Halbfinale", "Viertelfinale", "Achtelfinale"];

export type HomeBase = { name: string; lat: number; lng: number };
export const HOME_BASES: HomeBase[] = [
  { name: "Zürich", lat: 47.3769, lng: 8.5417 },
  { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
];

// Realistischer Kalender 2026 (chronologisch)
export const TOURNAMENTS: Tournament[] = [
  { id: "brisbane", name: "Brisbane International", city: "Brisbane", country: "Australien", lat: -27.4705, lng: 153.026, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-01-04", end: "2026-01-11", url: "https://brisbaneinternational.com.au", prize: 120000 },
  { id: "hongkong", name: "Hong Kong Tennis Open", city: "Hongkong", country: "Hongkong", lat: 22.3193, lng: 114.1694, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-01-05", end: "2026-01-11", url: "https://www.hktennisopen.hk", prize: 120000 },
  { id: "adelaide", name: "Adelaide International", city: "Adelaide", country: "Australien", lat: -34.9285, lng: 138.6007, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-01-12", end: "2026-01-17", url: "https://www.adelaideinternational.com.au", prize: 110000 },
  { id: "auckland", name: "ASB Classic", city: "Auckland", country: "Neuseeland", lat: -36.8485, lng: 174.7633, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-01-12", end: "2026-01-17", url: "https://www.asbclassic.co.nz", prize: 110000 },
  { id: "australian-open", name: "Australian Open", city: "Melbourne", country: "Australien", lat: -37.8136, lng: 144.9631, tier: "GS", surface: "Hartplatz", indoor: false, start: "2026-01-18", end: "2026-02-01", url: "https://www.ausopen.com", prize: 2200000 },
  { id: "montpellier", name: "Open Occitanie", city: "Montpellier", country: "Frankreich", lat: 43.6108, lng: 3.8767, tier: "ATP250", surface: "Hartplatz", indoor: true, start: "2026-02-02", end: "2026-02-08", url: "https://www.openoccitanie.com", prize: 100000 },
  { id: "rotterdam", name: "ABN AMRO Open", city: "Rotterdam", country: "Niederlande", lat: 51.9244, lng: 4.4777, tier: "ATP500", surface: "Hartplatz", indoor: true, start: "2026-02-09", end: "2026-02-15", url: "https://www.abnamroopen.nl", prize: 540000 },
  { id: "dallas", name: "Dallas Open", city: "Dallas", country: "USA", lat: 32.7767, lng: -96.797, tier: "ATP500", surface: "Hartplatz", indoor: true, start: "2026-02-09", end: "2026-02-15", url: "https://dallasopen.com", prize: 640000 },
  { id: "buenos-aires", name: "Argentina Open", city: "Buenos Aires", country: "Argentinien", lat: -34.6037, lng: -58.3816, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-02-09", end: "2026-02-15", url: "https://www.argentinaopen.com", prize: 110000 },
  { id: "doha", name: "Qatar ExxonMobil Open", city: "Doha", country: "Katar", lat: 25.2854, lng: 51.531, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-02-16", end: "2026-02-22", url: "https://qatartennis.org", prize: 500000 },
  { id: "rio", name: "Rio Open", city: "Rio de Janeiro", country: "Brasilien", lat: -22.9068, lng: -43.1729, tier: "ATP500", surface: "Sand", indoor: false, start: "2026-02-16", end: "2026-02-22", url: "https://www.rioopen.com", prize: 330000 },
  { id: "delray-beach", name: "Delray Beach Open", city: "Delray Beach", country: "USA", lat: 26.4615, lng: -80.0728, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-02-16", end: "2026-02-22", url: "https://www.delraybeachopen.com", prize: 110000 },
  { id: "cherbourg", name: "Challenger Cherbourg", city: "Cherbourg", country: "Frankreich", lat: 49.6337, lng: -1.622, tier: "CH125", surface: "Hartplatz", indoor: true, start: "2026-02-16", end: "2026-02-22", url: "https://www.challengerdecherbourg.fr", prize: 12980 },
  { id: "dubai", name: "Dubai Duty Free Tennis Championships", city: "Dubai", country: "VAE", lat: 25.2048, lng: 55.2708, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-02-23", end: "2026-03-01", url: "https://www.dubaidutyfreetennischampionships.com", prize: 500000 },
  { id: "acapulco", name: "Abierto Mexicano de Tenis", city: "Acapulco", country: "Mexiko", lat: 16.8531, lng: -99.8237, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-02-23", end: "2026-03-01", url: "https://www.abiertomexicanodetenis.com", prize: 500000 },
  { id: "santiago", name: "Chile Open", city: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-02-23", end: "2026-03-01", prize: 110000 },
  { id: "indian-wells", name: "BNP Paribas Open", city: "Indian Wells", country: "USA", lat: 33.7175, lng: -116.345, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-03-04", end: "2026-03-15", url: "https://bnpparibasopen.com", prize: 1000000 },
  { id: "miami", name: "Miami Open", city: "Miami Gardens", country: "USA", lat: 25.942, lng: -80.2456, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-03-17", end: "2026-03-29", url: "https://www.miamiopen.com", prize: 1000000 },
  { id: "houston", name: "US Men's Clay Court Championships", city: "Houston", country: "USA", lat: 29.7604, lng: -95.3698, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-03-30", end: "2026-04-05", url: "https://www.mensclaycourt.com", prize: 110000 },
  { id: "marrakech", name: "Grand Prix Hassan II", city: "Marrakesch", country: "Marokko", lat: 31.6295, lng: -7.9811, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-03-30", end: "2026-04-05", prize: 90000 },
  { id: "bucharest", name: "Tiriac Open", city: "Bukarest", country: "Rumänien", lat: 44.4268, lng: 26.1025, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-03-30", end: "2026-04-05", prize: 90000 },
  { id: "monte-carlo", name: "Rolex Monte-Carlo Masters", city: "Monte-Carlo", country: "Monaco", lat: 43.7503, lng: 7.4386, tier: "ATP1000", surface: "Sand", indoor: false, start: "2026-04-05", end: "2026-04-12", url: "https://www.montecarlotennismasters.com", prize: 950000 },
  { id: "vic", name: "ITF M25 Vic", city: "Vic", country: "Spanien", lat: 41.9301, lng: 2.2549, tier: "ITF25", surface: "Sand", indoor: false, start: "2026-04-13", end: "2026-04-19", url: "https://www.itftennis.com/en/tournament/m25-vic/esp/2026/m-itf-esp-2026-015/", prize: 4243 },
  { id: "barcelona", name: "Barcelona Open Banc Sabadell", city: "Barcelona", country: "Spanien", lat: 41.3874, lng: 2.1686, tier: "ATP500", surface: "Sand", indoor: false, start: "2026-04-13", end: "2026-04-19", url: "https://www.barcelonaopenbancsabadell.com", prize: 830000 },
  { id: "munich", name: "BMW Open by Bitpanda", city: "München", country: "Deutschland", lat: 48.1351, lng: 11.582, tier: "ATP500", surface: "Sand", indoor: false, start: "2026-04-13", end: "2026-04-19", url: "https://www.bmwopen.de", prize: 510000 },
  { id: "madrid", name: "Mutua Madrid Open", city: "Madrid", country: "Spanien", lat: 40.4168, lng: -3.7038, tier: "ATP1000", surface: "Sand", indoor: false, start: "2026-04-22", end: "2026-05-03", url: "https://www.madrid-open.com", prize: 1000000 },
  { id: "rome", name: "Internazionali BNL d'Italia", city: "Rom", country: "Italien", lat: 41.9028, lng: 12.4964, tier: "ATP1000", surface: "Sand", indoor: false, start: "2026-05-06", end: "2026-05-17", url: "https://www.internazionalibnlditalia.com", prize: 1000000 },
  { id: "hamburg", name: "Hamburg Open", city: "Hamburg", country: "Deutschland", lat: 53.5511, lng: 9.9937, tier: "ATP500", surface: "Sand", indoor: false, start: "2026-05-17", end: "2026-05-23", url: "https://hamburgopenatp500.com", prize: 510000 },
  { id: "geneva", name: "Gonet Geneva Open", city: "Genf", country: "Schweiz", lat: 46.2044, lng: 6.1432, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-05-17", end: "2026-05-23", prize: 110000 },
  { id: "roland-garros", name: "Roland-Garros", city: "Paris", country: "Frankreich", lat: 48.847, lng: 2.253, tier: "GS", surface: "Sand", indoor: false, start: "2026-05-24", end: "2026-06-07", url: "https://www.rolandgarros.com", prize: 2550000 },
  { id: "s-hertogenbosch", name: "Libema Open", city: "'s-Hertogenbosch", country: "Niederlande", lat: 51.6978, lng: 5.3037, tier: "ATP250", surface: "Rasen", indoor: false, start: "2026-06-08", end: "2026-06-14", url: "https://www.libema-open.nl", prize: 120000 },
  { id: "stuttgart", name: "BOSS Open", city: "Stuttgart", country: "Deutschland", lat: 48.7758, lng: 9.1829, tier: "ATP250", surface: "Rasen", indoor: false, start: "2026-06-08", end: "2026-06-14", url: "https://bossopen.com", prize: 130000 },
  { id: "halle", name: "Terra Wortmann Open", city: "Halle", country: "Deutschland", lat: 52.0629, lng: 8.356, tier: "ATP500", surface: "Rasen", indoor: false, start: "2026-06-15", end: "2026-06-21", url: "https://www.terrawortmann-open.de", prize: 800000 },
  { id: "queens", name: "HSBC Championships Queen's", city: "London", country: "Grossbritannien", lat: 51.4837, lng: -0.2119, tier: "ATP500", surface: "Rasen", indoor: false, start: "2026-06-15", end: "2026-06-21", url: "https://www.lta.org.uk/fan-zone/international/hsbc-championships/", prize: 700000 },
  { id: "mallorca", name: "Mallorca Championships", city: "Palma de Mallorca", country: "Spanien", lat: 39.5696, lng: 2.6502, tier: "ATP250", surface: "Rasen", indoor: false, start: "2026-06-21", end: "2026-06-27", url: "https://www.mallorcachampionships.com", prize: 120000 },
  { id: "eastbourne", name: "Lexus Eastbourne Open", city: "Eastbourne", country: "Grossbritannien", lat: 50.7687, lng: 0.2836, tier: "ATP250", surface: "Rasen", indoor: false, start: "2026-06-22", end: "2026-06-27", prize: 120000 },
  { id: "wimbledon", name: "Wimbledon", city: "London", country: "Grossbritannien", lat: 51.434, lng: -0.2144, tier: "GS", surface: "Rasen", indoor: false, start: "2026-06-29", end: "2026-07-12", url: "https://www.wimbledon.com", prize: 3500000 },
  { id: "braunschweig", name: "Brawo Open Braunschweig", city: "Braunschweig", country: "Deutschland", lat: 52.2689, lng: 10.5268, tier: "CH125", surface: "Sand", indoor: false, start: "2026-07-06", end: "2026-07-12", url: "https://brawo-open.de", prize: 25740 },
  { id: "bastad", name: "Nordea Open", city: "Bastad", country: "Schweden", lat: 56.43, lng: 12.85, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-07-13", end: "2026-07-19", url: "https://nordeaopen.se", prize: 100000 },
  { id: "gstaad", name: "EFG Swiss Open Gstaad", city: "Gstaad", country: "Schweiz", lat: 46.47, lng: 7.29, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-07-13", end: "2026-07-19", url: "https://www.swissopengstaad.ch", prize: 100000 },
  { id: "umag", name: "Croatia Open Umag", city: "Umag", country: "Kroatien", lat: 45.43, lng: 13.52, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-07-13", end: "2026-07-19", url: "https://www.croatiaopen.hr", prize: 100000 },
  { id: "kitzbuhel", name: "Generali Open Kitzbühel", city: "Kitzbühel", country: "Österreich", lat: 47.45, lng: 12.39, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-07-20", end: "2026-07-26", url: "https://www.generali-open.at", prize: 100000 },
  { id: "estoril", name: "Millennium Estoril Open", city: "Estoril", country: "Portugal", lat: 38.71, lng: -9.4, tier: "ATP250", surface: "Sand", indoor: false, start: "2026-07-20", end: "2026-07-26", url: "https://www.millenniumestorilopen.com", prize: 100000 },
  { id: "porto", name: "Eupago Porto Open", city: "Porto", country: "Portugal", lat: 41.1579, lng: -8.6291, tier: "CH100", surface: "Sand", indoor: false, start: "2026-07-20", end: "2026-07-26", url: "https://eupagoportoopen.org", prize: 20630 },
  { id: "loscabos", name: "Mifel Tennis Open", city: "Los Cabos", country: "Mexiko", lat: 23.06, lng: -109.7, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-07-27", end: "2026-08-01", prize: 95000 },
  { id: "washington", name: "Mubadala Citi DC Open", city: "Washington", country: "USA", lat: 38.9, lng: -77.04, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-07-27", end: "2026-08-02", url: "https://www.mubadaladctennis.com", prize: 350000 },
  { id: "montreal", name: "National Bank Open Montreal", city: "Montreal", country: "Kanada", lat: 45.5, lng: -73.57, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-08-02", end: "2026-08-13", url: "https://www.nationalbankopen.com", prize: 1000000 },
  { id: "cincinnati", name: "Cincinnati Open", city: "Cincinnati", country: "USA", lat: 39.36, lng: -84.3, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-08-11", end: "2026-08-23", url: "https://www.cincinnatiopen.com", prize: 1000000 },
  { id: "winstonsalem", name: "Winston-Salem Open", city: "Winston-Salem", country: "USA", lat: 36.1, lng: -80.24, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-08-22", end: "2026-08-29", url: "https://www.winstonsalemopen.com", prize: 100000 },
  { id: "usopen", name: "US Open", city: "New York", country: "USA", lat: 40.75, lng: -73.85, tier: "GS", surface: "Hartplatz", indoor: false, start: "2026-08-30", end: "2026-09-13", url: "https://www.usopen.org", prize: 4600000 },
  { id: "chengdu", name: "Chengdu Open", city: "Chengdu", country: "China", lat: 30.57, lng: 104.07, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-09-21", end: "2026-09-27", prize: 140000 },
  { id: "hangzhou", name: "Hangzhou Open", city: "Hangzhou", country: "China", lat: 30.27, lng: 120.15, tier: "ATP250", surface: "Hartplatz", indoor: false, start: "2026-09-21", end: "2026-09-27", prize: 140000 },
  { id: "beijing", name: "China Open", city: "Beijing", country: "China", lat: 39.9, lng: 116.4, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-09-28", end: "2026-10-04", prize: 700000 },
  { id: "tokyo", name: "Kinoshita Group Japan Open", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-09-28", end: "2026-10-04", url: "https://www.japanopentennis.com", prize: 400000 },
  { id: "shanghai", name: "Rolex Shanghai Masters", city: "Shanghai", country: "China", lat: 31.23, lng: 121.47, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-10-07", end: "2026-10-18", url: "https://en.rolexshanghaimasters.com/en", prize: 1000000 },
  { id: "almaty", name: "Almaty Open", city: "Almaty", country: "Kasachstan", lat: 43.24, lng: 76.89, tier: "ATP250", surface: "Hartplatz", indoor: true, start: "2026-10-12", end: "2026-10-18", prize: 100000 },
  { id: "lyon", name: "Open 13 Provence Lyon", city: "Lyon", country: "Frankreich", lat: 45.77, lng: 4.99, tier: "ATP250", surface: "Hartplatz", indoor: true, start: "2026-10-19", end: "2026-10-25", url: "https://www.open13.fr", prize: 100000 },
  { id: "brussels", name: "European Open", city: "Brüssel", country: "Belgien", lat: 50.85, lng: 4.35, tier: "ATP250", surface: "Hartplatz", indoor: true, start: "2026-10-19", end: "2026-10-25", prize: 100000 },
  { id: "vienna", name: "Erste Bank Open", city: "Wien", country: "Österreich", lat: 48.21, lng: 16.37, tier: "ATP500", surface: "Hartplatz", indoor: true, start: "2026-10-26", end: "2026-11-01", url: "https://www.erstebank-open.com", prize: 480000 },
  { id: "basel", name: "Swiss Indoors Basel", city: "Basel", country: "Schweiz", lat: 47.56, lng: 7.59, tier: "ATP500", surface: "Hartplatz", indoor: true, start: "2026-10-26", end: "2026-11-01", url: "https://www.swissindoorsbasel.ch", prize: 480000 },
  { id: "paris", name: "Rolex Paris Masters", city: "Paris", country: "Frankreich", lat: 48.89, lng: 2.24, tier: "ATP1000", surface: "Hartplatz", indoor: true, start: "2026-10-31", end: "2026-11-08", url: "https://www.rolexparismasters.com", prize: 950000 },
  { id: "stockholm", name: "BNP Paribas Nordic Open", city: "Stockholm", country: "Schweden", lat: 59.33, lng: 18.06, tier: "ATP250", surface: "Hartplatz", indoor: true, start: "2026-11-08", end: "2026-11-14", url: "https://www.bnppnordicopen.com", prize: 100000 },
  { id: "atpfinals", name: "Nitto ATP Finals", city: "Turin", country: "Italien", lat: 45.07, lng: 7.69, tier: "ATP1000", surface: "Hartplatz", indoor: true, start: "2026-11-15", end: "2026-11-22", url: "https://www.nittoatpfinals.com", prize: 2400000 },
];

// Offizielle Turnier-Website (öffentliche Quelle) + verifiziertes Sieger-Preisgeld (EUR).
// Wird aus öffentlichen Quellen (ATP/ITF/offizielle Seiten) gepflegt.
export const TOURNAMENT_URL: Record<string, string> = {
  ao: "https://ausopen.com",
  marseille: "https://www.open13.fr",
  cherbourg: "https://www.challengerdecherbourg.fr",
  dubai: "https://dubaidutyfreetennischampionships.com",
  indianwells: "https://bnpparibasopen.com",
  miami: "https://www.miamiopen.com",
  montecarlo: "https://montecarlotennismasters.com",
  vic: "https://www.itftennis.com/en/tournament/m25-vic/esp/2026/m-itf-esp-2026-015/",
  barcelona: "https://www.barcelonaopenbancsabadell.com",
  madrid: "https://mutuamadridopen.com",
  rome: "https://internazionalibnlditalia.com",
  rolandgarros: "https://www.rolandgarros.com",
  stuttgart: "https://bossopen.com",
  halle: "https://www.terrawortmann-open.de",
  queens: "https://www.lta.org.uk/fan-zone/international/hsbc-championships/",
  wimbledon: "https://www.wimbledon.com",
  braunschweig: "https://brawo-open.de",
  hamburg: "https://hamburgopenatp500.com",
  porto: "https://eupagoportoopen.org",
  toronto: "https://nationalbankopen.com",
  cincinnati: "https://cincinnatiopen.com",
  usopen: "https://www.usopen.org",
  tokyo: "https://www.japanopentennis.com",
  shanghai: "https://en.rolexshanghaimasters.com/en",
  vienna: "https://www.erstebank-open.com",
  parisbercy: "https://www.rolexparismasters.com",
};
// Sieger-Preisgeld (Einzel, ca. EUR) – öffentliche Turnier-/ATP-Angaben, letzte Edition (2025)
export const TOURNAMENT_PRIZE: Record<string, number> = {
  ao: 2100000, marseille: 112660, cherbourg: 12980, dubai: 557088, indianwells: 1105035,
  miami: 1034430, montecarlo: 946610, vic: 4243, barcelona: 546400, madrid: 985030,
  rome: 985030, rolandgarros: 2550000, stuttgart: 114335, halle: 471755, queens: 471755,
  wimbledon: 3510000, braunschweig: 25740, hamburg: 403665, porto: 20630, toronto: 1034430,
  cincinnati: 1034430, usopen: 4600000, tokyo: 383056, shanghai: 1034430, vienna: 511835,
  parisbercy: 946610,
};
export const prizeFor = (t: Tournament) => t.prize ?? TOURNAMENT_PRIZE[t.id] ?? TIER_META[t.tier].prize;
// offizielle Seite (DB > Map) wenn bekannt, sonst nie-toter Such-Fallback → jedes Turnier hat IMMER einen Link
export const urlFor = (t: Tournament): { url: string; official: boolean } => {
  const official = t.url ?? TOURNAMENT_URL[t.id];
  return official
    ? { url: official, official: true }
    : { url: `https://www.google.com/search?q=${encodeURIComponent(t.name + " tennis " + t.start.slice(0, 4))}`, official: false };
};

// Service-Angebot vor Ort je Kategorie (Richtwerte; grössere Events bieten mehr)
export const EXTRAS: Record<Tier, string[]> = {
  GS: ["Besaitungsservice", "Physiotherapie", "Fitnessstudio", "Spielerrestaurant", "Players Lounge", "Shuttle", "Wäscheservice", "Offizielles Spielerhotel", "Trainingsplätze", "Hawkeye", "Live-Streaming"],
  ATP1000: ["Besaitungsservice", "Physiotherapie", "Fitnessstudio", "Spielerrestaurant", "Players Lounge", "Shuttle", "Wäscheservice", "Offizielles Spielerhotel", "Trainingsplätze", "Hawkeye", "Live-Streaming"],
  ATP500: ["Besaitungsservice", "Physiotherapie", "Fitnessstudio", "Spielerrestaurant", "Players Lounge", "Shuttle", "Trainingsplätze", "Hawkeye", "Live-Streaming"],
  ATP250: ["Besaitungsservice", "Physiotherapie", "Fitnessstudio", "Players Lounge", "Trainingsplätze", "Live-Streaming"],
  CH125: ["Besaitungsservice", "Physiotherapie", "Trainingsplätze", "Live-Streaming"],
  CH100: ["Besaitungsservice", "Physiotherapie", "Trainingsplätze"],
  CH75: ["Besaitungsservice", "Trainingsplätze"],
  CH50: ["Besaitungsservice", "Trainingsplätze"],
  ITF25: ["Besaitungsservice", "Trainingsplätze"],
  ITF15: ["Trainingsplätze"],
};

// Gesamtdauer der Saison (erster Turnierstart bis letztes Turnierende, in Tagen)
export function planSpanDays(plan: Tournament[]): number {
  if (!plan.length) return 0;
  const starts = plan.map((t) => Date.parse(t.start));
  const ends = plan.map((t) => Date.parse(t.end));
  return Math.round((Math.max(...ends) - Math.min(...starts)) / 86400000) + 1;
}

export const byDate = (a: Tournament, b: Tournament) => a.start.localeCompare(b.start);

const MS_DAY = 86400000;
export function nights(t: Tournament): number {
  return Math.max(1, Math.round((Date.parse(t.end) - Date.parse(t.start)) / MS_DAY) + 1);
}
export function entryDeadline(t: Tournament): string {
  return new Date(Date.parse(t.start) - 42 * MS_DAY).toISOString().slice(0, 10);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}
export function fmtRange(t: Tournament): string {
  return `${fmtDate(t.start)}–${fmtDate(t.end)}`;
}
export function fmtEUR(n: number): string {
  // geschütztes Leerzeichen vor € → Betrag bricht nie auf zwei Zeilen um
  return n.toLocaleString("de-CH", { maximumFractionDigits: 0 }) + " €";
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const HOTEL_NIGHT: Record<Tier, number> = {
  GS: 190, ATP1000: 180, ATP500: 160, ATP250: 140, CH125: 95, CH100: 90, CH75: 85, CH50: 80, ITF25: 70, ITF15: 65,
};
const ENTRY_FEE: Record<Tier, number> = {
  GS: 0, ATP1000: 0, ATP500: 0, ATP250: 0, CH125: 0, CH100: 0, CH75: 0, CH50: 0, ITF25: 45, ITF15: 40,
};
const TRANSFER = 45;

export type Leg = { from: string; to: string; mode: "Flug" | "Bahn" | "Auto"; km: number; cost: number };
export function leg(from: { name?: string; city?: string; lat: number; lng: number }, to: { name?: string; city?: string; lat: number; lng: number }): Leg {
  const km = haversine(from, to);
  let mode: Leg["mode"];
  let cost: number;
  if (km < 250) { mode = "Auto"; cost = Math.round(km * 0.35) + 20; }
  else if (km < 700) { mode = "Bahn"; cost = Math.round(km * 0.14) + 30; }
  else { mode = "Flug"; cost = Math.round(km * 0.11) + 60; }
  return { from: from.name ?? from.city ?? "", to: to.name ?? to.city ?? "", mode, km, cost };
}

export type PlanCost = {
  perTour: { t: Tournament; nights: number; hotel: number; transfer: number; entry: number; total: number; leg: Leg }[];
  travel: number;
  hotels: number;
  transfers: number;
  entry: number;
  total: number;
  points: number;
  prize: number;
};
// Smart-Planer: beste Startbasis (minimale Reisekosten) für einen gegebenen Plan
export function bestStartBase(plan: Tournament[]): HomeBase {
  let best = HOME_BASES[0];
  let bestCost = Infinity;
  for (const b of HOME_BASES) {
    const c = computePlan(plan, b).travel;
    if (c < bestCost) { bestCost = c; best = b; }
  }
  return best;
}

// Smart-Planer: kostengünstigste Saison im Budget zusammenstellen.
// Greedy nach bestem Punkte-pro-Zusatzkosten-Verhältnis → bündelt automatisch geografisch
// (nahe Turniere haben tiefe Zusatz-Reisekosten → hohes Verhältnis) und spart so Flüge.
export function autoPlan(list: Tournament[], budgetLimit: number, start: HomeBase): string[] {
  const chosen: Tournament[] = [];
  const remaining = new Set(list.map((t) => t.id));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const base = computePlan([...chosen].sort(byDate), start).total;
    let best: { t: Tournament; ratio: number } | null = null;
    for (const id of remaining) {
      const t = list.find((x) => x.id === id)!;
      const trial = [...chosen, t].sort(byDate);
      const c = computePlan(trial, start);
      if (c.total > budgetLimit) continue;
      const marginalCost = Math.max(1, c.total - base);
      const ratio = TIER_META[t.tier].points[0] / marginalCost;
      if (!best || ratio > best.ratio) best = { t, ratio };
    }
    if (!best) break;
    chosen.push(best.t);
    remaining.delete(best.t.id);
  }
  return chosen.sort(byDate).map((t) => t.id);
}

export function computePlan(plan: Tournament[], start: HomeBase): PlanCost {
  let travel = 0, hotels = 0, transfers = 0, entry = 0, points = 0, prize = 0;
  let prev: { name?: string; city?: string; lat: number; lng: number } = start;
  const perTour = plan.map((t) => {
    const lg = leg(prev, t);
    const n = nights(t);
    const hotel = n * HOTEL_NIGHT[t.tier];
    const fee = ENTRY_FEE[t.tier];
    const meta = TIER_META[t.tier];
    travel += lg.cost; hotels += hotel; transfers += TRANSFER; entry += fee;
    points += meta.points[0]; prize += prizeFor(t);
    prev = t;
    return { t, nights: n, hotel, transfer: TRANSFER, entry: fee, total: lg.cost + hotel + TRANSFER + fee, leg: lg };
  });
  return { perTour, travel, hotels, transfers, entry, total: travel + hotels + transfers + entry, points, prize };
}
