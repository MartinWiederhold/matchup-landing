// Schläger-Katalog (/beratung/katalog) — DE + EN zusammen gepflegt.
// WICHTIG: Die sieben Achsen sind die KATALOG-Taxonomie (Quelle extreme-tennis.fr),
// NICHT die Finder-Achsen aus src/domain/equipment/racket.ts. Namen bewusst DE/EN,
// nicht Französisch.
export const catalog = {
  de: {
    // Kopf / SEO
    eyebrow: "Matchup Beratung",
    title: "Schläger-Katalog & Vergleich",
    subtitle: "Durchsuche über 400 Rahmen, sieh das Netzdiagramm der sieben Testwerte und vergleiche zwei Schläger direkt nebeneinander.",
    seoTitle: "Schläger-Katalog & Vergleich",
    seoDescription: "Tennisschläger im Netzdiagramm: sieben Testwerte, technische Daten und direkter Vergleich zweier Rahmen.",

    // Zustände
    loading: "Katalog wird geladen …",
    loadError: "Der Katalog konnte nicht geladen werden. Bitte später erneut versuchen.",
    loginRequiredTitle: "Anmeldung nötig",
    loginRequiredText: "Der Schläger-Katalog ist angemeldeten Mitgliedern vorbehalten.",
    loginCta: "Zur App",

    // Suche + Filter
    searchPlaceholder: "Schläger suchen (Name) …",
    brandAll: "Alle Marken",
    brandLabel: "Marke",
    resultCount: "{n} von {total} Schlägern",
    noResults: "Keine Schläger für diese Suche.",

    // Liste / Auswahl
    select: "Auswählen",
    selected: "Ausgewählt",
    compareAdd: "Vergleichen",
    compareRemove: "Aus Vergleich",
    compareFull: "Es lassen sich höchstens zwei Schläger vergleichen.",
    clearSelection: "Auswahl zurücksetzen",
    onlyTech: "nur Technik",

    // Detail
    pickTitle: "Wähle einen Schläger",
    pickText: "Tippe links auf einen Schläger — Netzdiagramm, Testwerte und technische Daten erscheinen hier.",
    valuesTitle: "Testwerte",
    techTitle: "Technische Daten",
    price: "Preis",
    productPage: "Zur Produktseite",
    noTestValuesTitle: "Keine Testwerte gepflegt",
    noTestValuesNote: "Für diesen Schläger liegen keine sieben Testwerte vor — deshalb kein Netzdiagramm. Die technischen Daten stehen unten.",

    // Diagramm-Hinweis (Beratungs-Haltung: Bewertung einer Quelle, kein absoluter Fakt)
    radarNote: "Testwerte auf einer Skala von 0 bis 100 — eine Bewertung, kein absoluter Messwert. Quelle: extreme-tennis.fr.",

    // Achsen (Katalog-Taxonomie)
    axis_puissance: "Power",
    axis_controle: "Kontrolle",
    axis_confort: "Komfort",
    axis_prise_deffet: "Spin",
    axis_tolerance: "Toleranz",
    axis_maniabilite: "Handling",
    axis_stabilite: "Stabilität",

    // Technik-Labels
    tech_weight: "Gewicht",
    tech_balance: "Balance",
    tech_headSize: "Kopfgröße",
    tech_pattern: "Besaitungsbild",
    tech_stiffness: "Steifigkeit (RA)",
    tech_inertia: "Inertie (Swingweight)",
    tech_profile: "Profil",
    tech_twistweight: "Twistweight",
    tech_length: "Länge",
    tech_recoil: "Recoil Weight",
    tech_plow: "Plow-Through",
    notMaintained: "—",
  },
  en: {
    eyebrow: "Matchup Advice",
    title: "Racket Catalog & Compare",
    subtitle: "Search over 400 frames, see the radar chart of the seven test values and compare two rackets side by side.",
    seoTitle: "Racket Catalog & Compare",
    seoDescription: "Tennis rackets as a radar chart: seven test values, technical data and a direct comparison of two frames.",

    loading: "Loading catalog …",
    loadError: "The catalog could not be loaded. Please try again later.",
    loginRequiredTitle: "Sign in required",
    loginRequiredText: "The racket catalog is available to signed-in members.",
    loginCta: "Open the app",

    searchPlaceholder: "Search rackets (name) …",
    brandAll: "All brands",
    brandLabel: "Brand",
    resultCount: "{n} of {total} rackets",
    noResults: "No rackets match this search.",

    select: "Select",
    selected: "Selected",
    compareAdd: "Compare",
    compareRemove: "Remove",
    compareFull: "You can compare at most two rackets.",
    clearSelection: "Clear selection",
    onlyTech: "tech only",

    pickTitle: "Pick a racket",
    pickText: "Tap a racket on the left — its radar chart, test values and technical data appear here.",
    valuesTitle: "Test values",
    techTitle: "Technical data",
    price: "Price",
    productPage: "Product page",
    noTestValuesTitle: "No test values available",
    noTestValuesNote: "This racket has no seven test values on file — so no radar chart. Its technical data is shown below.",

    radarNote: "Test values on a 0–100 scale — a rating, not an absolute measurement. Source: extreme-tennis.fr.",

    axis_puissance: "Power",
    axis_controle: "Control",
    axis_confort: "Comfort",
    axis_prise_deffet: "Spin",
    axis_tolerance: "Tolerance",
    axis_maniabilite: "Maneuverability",
    axis_stabilite: "Stability",

    tech_weight: "Weight",
    tech_balance: "Balance",
    tech_headSize: "Head size",
    tech_pattern: "String pattern",
    tech_stiffness: "Stiffness (RA)",
    tech_inertia: "Inertia (swingweight)",
    tech_profile: "Beam",
    tech_twistweight: "Twistweight",
    tech_length: "Length",
    tech_recoil: "Recoil Weight",
    tech_plow: "Plow-Through",
    notMaintained: "—",
  },
};
