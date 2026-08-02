// i18n-Namespace für die öffentliche Turnier-Route /tour.
// Ländernamen liegen bewusst hier (nicht zur Laufzeit abgeleitet); erzeugt aus CLDR,
// abgedeckt sind die in web.tour_tournaments vorkommenden ISO-3166-1-alpha-2-Codes.

const country_de: Record<string, string> = {
  AE: "Vereinigte Arabische Emirate", AM: "Armenien", AO: "Angola", AR: "Argentinien",
  AT: "Österreich", AU: "Australien", BA: "Bosnien und Herzegowina", BE: "Belgien",
  BG: "Bulgarien", BH: "Bahrain", BM: "Bermuda", BO: "Bolivien", BR: "Brasilien",
  BW: "Botsuana", CA: "Kanada", CG: "Kongo (Rep.)", CH: "Schweiz", CI: "Côte d’Ivoire",
  CL: "Chile", CN: "China", CO: "Kolumbien", CR: "Costa Rica", CY: "Zypern",
  CZ: "Tschechien", DE: "Deutschland", DK: "Dänemark", DO: "Dominikanische Republik",
  EC: "Ecuador", EG: "Ägypten", ES: "Spanien", FI: "Finnland", FR: "Frankreich",
  GB: "Vereinigtes Königreich", GE: "Georgien", GR: "Griechenland", GU: "Guam",
  HK: "Hongkong", HR: "Kroatien", HU: "Ungarn", ID: "Indonesien", IE: "Irland",
  IN: "Indien", IR: "Iran", IT: "Italien", JM: "Jamaika", JP: "Japan", KR: "Südkorea",
  KW: "Kuwait", KZ: "Kasachstan", LU: "Luxemburg", MA: "Marokko", MD: "Republik Moldau",
  MK: "Nordmazedonien", MT: "Malta", MX: "Mexiko", MY: "Malaysia", NC: "Neukaledonien",
  NL: "Niederlande", NO: "Norwegen", NZ: "Neuseeland", PE: "Peru", PK: "Pakistan",
  PL: "Polen", PT: "Portugal", PY: "Paraguay", QA: "Katar", RO: "Rumänien", RS: "Serbien",
  RW: "Ruanda", SE: "Schweden", SG: "Singapur", SI: "Slowenien", SK: "Slowakei",
  SM: "San Marino", SV: "El Salvador", TH: "Thailand", TN: "Tunesien", TR: "Türkei",
  TW: "Taiwan", US: "Vereinigte Staaten", UY: "Uruguay", UZ: "Usbekistan", VN: "Vietnam",
  ZA: "Südafrika",
};

const country_en: Record<string, string> = {
  AE: "United Arab Emirates", AM: "Armenia", AO: "Angola", AR: "Argentina", AT: "Austria",
  AU: "Australia", BA: "Bosnia & Herzegovina", BE: "Belgium", BG: "Bulgaria", BH: "Bahrain",
  BM: "Bermuda", BO: "Bolivia", BR: "Brazil", BW: "Botswana", CA: "Canada",
  CG: "Congo (Rep.)", CH: "Switzerland", CI: "Côte d’Ivoire", CL: "Chile", CN: "China",
  CO: "Colombia", CR: "Costa Rica", CY: "Cyprus", CZ: "Czechia", DE: "Germany",
  DK: "Denmark", DO: "Dominican Republic", EC: "Ecuador", EG: "Egypt", ES: "Spain",
  FI: "Finland", FR: "France", GB: "United Kingdom", GE: "Georgia", GR: "Greece",
  GU: "Guam", HK: "Hong Kong", HR: "Croatia", HU: "Hungary", ID: "Indonesia", IE: "Ireland",
  IN: "India", IR: "Iran", IT: "Italy", JM: "Jamaica", JP: "Japan", KR: "South Korea",
  KW: "Kuwait", KZ: "Kazakhstan", LU: "Luxembourg", MA: "Morocco", MD: "Moldova",
  MK: "North Macedonia", MT: "Malta", MX: "Mexico", MY: "Malaysia", NC: "New Caledonia",
  NL: "Netherlands", NO: "Norway", NZ: "New Zealand", PE: "Peru", PK: "Pakistan",
  PL: "Poland", PT: "Portugal", PY: "Paraguay", QA: "Qatar", RO: "Romania", RS: "Serbia",
  RW: "Rwanda", SE: "Sweden", SG: "Singapore", SI: "Slovenia", SK: "Slovakia",
  SM: "San Marino", SV: "El Salvador", TH: "Thailand", TN: "Tunisia", TR: "Türkiye",
  TW: "Taiwan", US: "United States", UY: "Uruguay", UZ: "Uzbekistan", VN: "Vietnam",
  ZA: "South Africa",
};

export const tour = {
  de: {
    seoTitle: "Turnierkalender",
    seoDescription: "Kommende ITF- und Challenger-Turniere mit Meldefristen.",
    title: "Turnierkalender",
    subtitle: "Kommende ITF- und Challenger-Turniere mit Meldefristen.",

    // Auth-Gate
    loginRequiredTitle: "Anmeldung nötig",
    loginRequiredText: "Melde dich an, um die Turnierdaten zu sehen.",
    loginCta: "Zur Anmeldung",
    loading: "Lade Turniere …",
    loadError: "Turniere konnten nicht geladen werden.",

    // Filter
    filterCountry: "Land",
    filterCategory: "Kategorie",
    filterReset: "Filter zurücksetzen",
    resultCount: "{n} Turniere",
    empty: "Keine Turniere für diese Auswahl. Filter anpassen oder zurücksetzen.",

    // Karte
    series: "Serie",
    seriesItf: "ITF World Tennis Tour",
    seriesChallenger: "ATP Challenger",
    mondayLabel: "Turnierwoche ab",
    surfaceLabel: "Belag",
    surface_clay: "Sand",
    surface_hard: "Hartplatz",
    surface_grass: "Rasen",
    surface_carpet: "Teppich",
    indoor: "Halle",
    outdoor: "Freiluft",
    prizeLabel: "Preisgeld",
    fieldMissing: "fehlt",

    // Fristen
    deadlinesTitle: "Meldefristen",
    entry: "Meldeschluss (Entry)",
    withdrawal: "Rückzug (Withdrawal)",
    freeze: "Freeze",
    freezeUnverified: "ungeprüft",
    expired: "abgelaufen",
    tzHint: "Zeiten in deiner Zeitzone; Fristen sind offiziell auf 14:00 GMT verankert.",
    challengerUnknownTitle: "Fristen unbekannt",
    challengerUnknownText:
      "Für ATP-Challenger gilt nicht die ITF-Regel. Die genauen Fristen haben wir noch nicht hinterlegt — bitte im offiziellen Spielerportal prüfen.",

    country: country_de,
  },
  en: {
    seoTitle: "Tournament calendar",
    seoDescription: "Upcoming ITF and Challenger tournaments with entry deadlines.",
    title: "Tournament calendar",
    subtitle: "Upcoming ITF and Challenger tournaments with entry deadlines.",

    loginRequiredTitle: "Sign in required",
    loginRequiredText: "Sign in to see the tournament data.",
    loginCta: "Go to sign in",
    loading: "Loading tournaments …",
    loadError: "Could not load tournaments.",

    filterCountry: "Country",
    filterCategory: "Category",
    filterReset: "Reset filters",
    resultCount: "{n} tournaments",
    empty: "No tournaments for this selection. Adjust or reset the filters.",

    series: "Series",
    seriesItf: "ITF World Tennis Tour",
    seriesChallenger: "ATP Challenger",
    mondayLabel: "Tournament week from",
    surfaceLabel: "Surface",
    surface_clay: "Clay",
    surface_hard: "Hard",
    surface_grass: "Grass",
    surface_carpet: "Carpet",
    indoor: "Indoor",
    outdoor: "Outdoor",
    prizeLabel: "Prize money",
    fieldMissing: "missing",

    deadlinesTitle: "Entry deadlines",
    entry: "Entry deadline",
    withdrawal: "Withdrawal deadline",
    freeze: "Freeze",
    freezeUnverified: "unverified",
    expired: "passed",
    tzHint: "Times in your timezone; deadlines are officially anchored at 14:00 GMT.",
    challengerUnknownTitle: "Deadlines unknown",
    challengerUnknownText:
      "ATP Challenger does not follow the ITF rule. We have not recorded the exact deadlines yet — please check the official player portal.",

    country: country_en,
  },
};
