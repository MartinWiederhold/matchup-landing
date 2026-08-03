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
    filterCountriesMore: "Weitere Länder ({n})",
    filterCountriesFewer: "Weniger anzeigen",
    filterEmpty: "leer",
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

    // Turnier-Entscheider (src/domain/tour/decide.ts) — sachlicher, ruhiger Ton.
    decide: {
      title: "Einschätzung",
      confidenceLabel: "Verlässlichkeit",
      confidenceHigh: "belastbar",
      confidenceMedium: "eingeschränkt belastbar",
      confidenceLow: "kaum belastbar",
      lueckenTitle: "Grenzen dieser Einschätzung",
      cls: {
        frist_verstrichen: "Nicht mehr meldbar",
        frist_laeuft_bald_ab: "Meldefrist läuft bald ab",
        planbar: "Meldefrist offen",
        zu_weit_entfernt: "Zeitlich noch weit entfernt",
        fristen_unbekannt: "Meldefristen noch nicht hinterlegt",
      },
      reason: {
        turnier_bereits_vorbei: "Turnierwoche liegt in der Vergangenheit",
        meldefrist_verstrichen: "Meldeschluss ist bereits verstrichen",
        meldefrist_in_wenigen_tagen: "Meldeschluss in wenigen Tagen",
        meldefrist_reichlich_zeit: "Bis zum Meldeschluss ist noch reichlich Zeit",
        turnier_weit_entfernt: "Das Turnier liegt noch weit in der Zukunft",
        fristenregel_unbekannt: "Meldefristen für Challenger sind noch nicht hinterlegt",
        anreise_entfaellt_gleicher_ort: "Keine erneute Anreise — gleicher Ort wie die Vorstation",
        anreise_noetig_ortswechsel: "Ortswechsel gegenüber der Vorstation — Anreise nötig",
        kosten_unbekannt: "Kostensätze sind nicht hinterlegt",
      },
      luecke: {
        keine_punktehistorie: "Ohne Berücksichtigung deiner Ranglistenpunkte",
        keine_cutoff_prognose: "Ohne Prognose zur Zulassung (Cut-off)",
        freeze_variante_ungeprueft: "Freeze-Frist beruht auf einer noch nicht verifizierten Lesart",
      },
    },

    // Navigation zwischen den /tour-Seiten
    navCalendar: "Turnierkalender",
    navSeason: "Meine Saison",

    // Aufnehmen-Knopf (Turnierkalender)
    addToSeason: "Zur Saison hinzufügen",
    inSeason: "In deiner Saison",
    seasonSaveError: "Konnte nicht gespeichert werden. Bitte erneut versuchen.",

    // Saison-Seite (/tour/season)
    seasonSeoTitle: "Meine Saison",
    seasonSeoDescription: "Deine geplanten Turniere mit Fristen und Einschätzung.",
    seasonTitle: "Meine Saison",
    seasonSubtitle: "Deine aufgenommenen Turniere, geordnet nach Turnierwoche — mit Fristen und Einschätzung.",
    seasonCount: "{n} Turniere in deiner Saison",
    seasonEmptyTitle: "Noch keine Turniere",
    seasonEmptyText: "Nimm im Turnierkalender Turniere in deine Saison auf.",
    seasonEmptyCta: "Zum Turnierkalender",
    seasonRemove: "Aus Saison entfernen",
    statusLabel: "Status",
    status_planned: "Geplant",
    status_entered: "Gemeldet",
    status_confirmed: "Bestätigt",
    status_cancelled: "Abgesagt",
    tournamentInactive: "Dieses Turnier ist nicht mehr verfügbar. Es bleibt in deiner Saison, bis du es entfernst.",

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
    filterCountriesMore: "More countries ({n})",
    filterCountriesFewer: "Show fewer",
    filterEmpty: "empty",
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

    // Tournament decider (src/domain/tour/decide.ts) — factual, calm tone.
    decide: {
      title: "Assessment",
      confidenceLabel: "Reliability",
      confidenceHigh: "reliable",
      confidenceMedium: "limited reliability",
      confidenceLow: "little to go on",
      lueckenTitle: "Limits of this assessment",
      cls: {
        frist_verstrichen: "No longer open for entry",
        frist_laeuft_bald_ab: "Entry deadline closing soon",
        planbar: "Entry window open",
        zu_weit_entfernt: "Still far in the future",
        fristen_unbekannt: "Entry deadlines not recorded yet",
      },
      reason: {
        turnier_bereits_vorbei: "The tournament week is in the past",
        meldefrist_verstrichen: "The entry deadline has already passed",
        meldefrist_in_wenigen_tagen: "Entry deadline within a few days",
        meldefrist_reichlich_zeit: "Plenty of time until the entry deadline",
        turnier_weit_entfernt: "The tournament is still far in the future",
        fristenregel_unbekannt: "Entry deadlines for Challenger are not recorded yet",
        anreise_entfaellt_gleicher_ort: "No additional travel — same location as the previous stop",
        anreise_noetig_ortswechsel: "Different location from the previous stop — travel required",
        kosten_unbekannt: "Cost rates are not recorded",
      },
      luecke: {
        keine_punktehistorie: "Without taking your ranking points into account",
        keine_cutoff_prognose: "Without a cut-off (acceptance) forecast",
        freeze_variante_ungeprueft: "Freeze deadline is based on a reading we have not verified yet",
      },
    },

    // Navigation between the /tour pages
    navCalendar: "Tournament calendar",
    navSeason: "My season",

    // Add-to-season button (tournament calendar)
    addToSeason: "Add to season",
    inSeason: "In your season",
    seasonSaveError: "Couldn't save. Please try again.",

    // Season page (/tour/season)
    seasonSeoTitle: "My season",
    seasonSeoDescription: "Your planned tournaments with deadlines and assessment.",
    seasonTitle: "My season",
    seasonSubtitle: "Your saved tournaments, ordered by tournament week — with deadlines and assessment.",
    seasonCount: "{n} tournaments in your season",
    seasonEmptyTitle: "No tournaments yet",
    seasonEmptyText: "Add tournaments to your season from the tournament calendar.",
    seasonEmptyCta: "Go to tournament calendar",
    seasonRemove: "Remove from season",
    statusLabel: "Status",
    status_planned: "Planned",
    status_entered: "Entered",
    status_confirmed: "Confirmed",
    status_cancelled: "Cancelled",
    tournamentInactive: "This tournament is no longer available. It stays in your season until you remove it.",

    country: country_en,
  },
};
