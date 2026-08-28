/**
 * Texte für den /tour3-Prototyp. Eigener Namespace, damit /tour2 unangetastet
 * bleibt. Ton respektvoll und fachlich (kein Humor, keine Verniedlichung,
 * keine Emojis).
 */

export const tour3 = {
  de: {
    // Kopf
    greetName:        "{name}s Saison {year}",
    greetAnon:        "Saison {year}",
    labelRanking:     "Ranking",
    labelTournaments: "geplante Turniere",
    labelBudgetLeft:  "übrig im Budget",
    labelNextStop:    "nächster Halt",
    accentTitle:      "Akzent",

    // Karte / Zeitachse
    seasonMapTitle:   "Saison-Route",
    seasonBandTitle:  "Zeitachse",
    routeEmptyTitle:  "Noch keine Saison geplant",
    routeEmptyHint:   "Übernimm passende Turniere in deine Saison, um Karte und Zeitachse zu füllen.",
    routeEmptyCta:    "Zur Saisonplanung",

    // Entscheidung / dringendste Frist
    decisionTitle:    "Nächste Entscheidung",
    decisionEntry:    "Meldeschluss · {name}",
    decisionOpen:     "Zum Turnier",

    // Zwei-Spalten
    columnDeadlines:  "Fristen und offene Aufgaben",
    columnCosts:      "Kosten der Saison",
    deadlinesEmpty:   "Keine offenen Aufgaben.",
    costsUsed:        "Verplant",
    costsLeft:        "Restbudget",
    costsBudget:      "Saisonbudget",
    costsBudgetMissing: "Kein Saisonbudget hinterlegt.",
    costsPerCategory: "Aufschlüsselung",

    // Countdown / Zustände
    countdownFuture:  "in {d} Tagen",
    countdownToday:   "heute fällig",
    countdownPast:    "verpasst",
    stopPast:         "vergangen",
    stopCurrent:      "als Nächstes",
    stopPlanned:      "geplant",
    stopMissed:       "Frist verpasst",

    // Detailschublade
    drawerCategory:     "Kategorie",
    drawerDate:         "Termin",
    drawerSurface:      "Belag",
    drawerDeadline:     "Meldefrist",
    drawerDistancePrev: "Distanz zum vorherigen Stop",
    drawerCountry:      "Land",
    drawerOpen:         "Zum Turnier",

    // Rahmen
    metaSeasonBrand:  "Matchup Tour",
    kmSuffix:         "{n} km",

    // Ladezustände
    stateLoading:     "Saison wird geladen…",
    stateError:       "Saison konnte nicht geladen werden.",
    stateNotSignedIn: "Bitte anmelden, um die Saison zu sehen.",
  },
  en: {
    greetName:        "{name}'s {year} season",
    greetAnon:        "{year} season",
    labelRanking:     "Ranking",
    labelTournaments: "planned events",
    labelBudgetLeft:  "budget left",
    labelNextStop:    "next stop",
    accentTitle:      "Accent",

    seasonMapTitle:   "Season route",
    seasonBandTitle:  "Timeline",
    routeEmptyTitle:  "No season planned yet",
    routeEmptyHint:   "Add tournaments to your season to populate the map and the timeline.",
    routeEmptyCta:    "Open season planner",

    decisionTitle:    "Next decision",
    decisionEntry:    "Entry deadline · {name}",
    decisionOpen:     "Open tournament",

    columnDeadlines:  "Deadlines and to-do",
    columnCosts:      "Season costs",
    deadlinesEmpty:   "Nothing pending.",
    costsUsed:        "Planned",
    costsLeft:        "Left",
    costsBudget:      "Season budget",
    costsBudgetMissing: "No season budget on file.",
    costsPerCategory: "Breakdown",

    countdownFuture:  "in {d} days",
    countdownToday:   "due today",
    countdownPast:    "missed",
    stopPast:         "past",
    stopCurrent:      "next up",
    stopPlanned:      "planned",
    stopMissed:       "deadline missed",

    drawerCategory:     "Category",
    drawerDate:         "Date",
    drawerSurface:      "Surface",
    drawerDeadline:     "Entry deadline",
    drawerDistancePrev: "Distance from previous stop",
    drawerCountry:      "Country",
    drawerOpen:         "Open tournament",

    metaSeasonBrand:  "Matchup Tour",
    kmSuffix:         "{n} km",

    stateLoading:     "Loading season…",
    stateError:       "Could not load season.",
    stateNotSignedIn: "Sign in to view your season.",
  },
};
