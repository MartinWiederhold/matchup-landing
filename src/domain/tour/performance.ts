/**
 * Leistungsauswertung für die Tour (Domain-Schicht, v1).
 *
 *   Liste erfasster Matches (Sieg/Niederlage/offen, Belag, Kategorie, Saison, Turnier)
 *   →  Siegquoten gesamt / nach Belag / nach Kategorie, Bilanz je Saison und je Turnier
 *
 * Reine Funktionen: keine DB, kein Netzwerk, KEINE Systemzeit. Gleiche Eingabe ⇒ gleiche
 * Ausgabe (per Unit-Test abgesichert). Rückgaben tragen nur Zahlen/Codes, keine Sätze —
 * Übersetzung später per i18n.
 *
 * GRUNDLAGE IMMER MITFÜHREN: Jede Quote trägt `decided` (die Anzahl entschiedener Matches).
 * „60 % auf Sand" bei 5 Matches ist etwas anderes als bei 50 — die UI muss die Zahl zeigen
 * können. Bei `decided = 0` ist die Quote `null` (keine Basis), nie eine erfundene 0.
 *
 * OFFENE MATCHES: `won === null` (Ausgang nicht erfasst) zählt NICHT in die Quote, wird aber
 * als `open`/`total` ausgewiesen — die Auswertung verschweigt nichts.
 *
 * BELAG-LÜCKE: Der Belag kommt aus tour_tournaments und ist nur bei /tour-uuid-Turnieren
 * bekannt; /app-Slug-Matches haben keinen Belag → sie landen im Eimer `"unknown"`, statt
 * still wegzufallen (die Datenschicht setzt surface dann auf null).
 */

export const PERFORMANCE_RULES_VERSION = "v1";

// ── Ein-/Ausgabetypen ─────────────────────────────────────────────────────────
/** Ein erfasstes Match. `won=null` = Ausgang offen. `surface=null` = Belag unbekannt (/app-Slug). */
export type PerfMatch = {
  won: boolean | null;
  surface: string | null;
  category: string | null;
  season: number | null; // Jahr des Matches
  tournamentId: string;
  tournamentName: string;
};

/** Zählwerk einer Gruppe. `rate = wins/decided` (0..1) oder null, wenn keine Basis (decided=0). */
export type Tally = {
  wins: number;
  losses: number;
  open: number; // won === null
  decided: number; // wins + losses (Basis der Quote)
  total: number; // decided + open
  rate: number | null; // null bei decided === 0
};

export type Bucket = { key: string; tally: Tally };

export type WinRates = {
  rulesVersion: string;
  overall: Tally;
  bySurface: Bucket[]; // bekannte Beläge in fester Reihenfolge, "unknown" zuletzt
  byCategory: Bucket[]; // nach Basis (decided) absteigend, dann Schlüssel
};

export type SeasonBalance = { season: number | null; wins: number; losses: number; open: number };
export type TournamentBalance = { tournamentId: string; tournamentName: string; wins: number; losses: number; open: number };

/** Ein bewertetes, ZÄHLENDES Ergebnis mit Belag — Eingabe für pointsBySurface. */
export type ScoredSurfaceEntry = { surface: string | null; points: number; counts: boolean };
export type PointsBySurface = { surface: string; points: number; n: number };

// Bekannte Beläge in stabiler Anzeige-Reihenfolge (aus tour_tournaments.surface); alles
// andere danach alphabetisch, der Eimer "unknown" immer zuletzt.
const SURFACE_ORDER = ["hard", "clay", "grass", "carpet"] as const;
const UNKNOWN = "unknown";

// ── Zähl-Helfer ───────────────────────────────────────────────────────────────
function emptyTally(): Tally {
  return { wins: 0, losses: 0, open: 0, decided: 0, total: 0, rate: null };
}

/** Ein Match in ein Zählwerk aufnehmen (mutiert und gibt zurück). */
function addMatch(t: Tally, won: boolean | null): Tally {
  if (won === true) t.wins += 1;
  else if (won === false) t.losses += 1;
  else t.open += 1;
  t.decided = t.wins + t.losses;
  t.total = t.decided + t.open;
  t.rate = t.decided === 0 ? null : t.wins / t.decided;
  return t;
}

/** Belag-Schlüssel normalisieren: leer/null → "unknown", sonst klein getrimmt. */
function surfaceKey(surface: string | null): string {
  const s = (surface ?? "").trim().toLowerCase();
  return s === "" ? UNKNOWN : s;
}

/** Buckets einer Map in stabile Belag-Reihenfolge bringen (bekannte zuerst, "unknown" zuletzt). */
function orderSurfaceBuckets(map: Map<string, Tally>): Bucket[] {
  const rank = (k: string): number => {
    if (k === UNKNOWN) return 999;
    const i = SURFACE_ORDER.indexOf(k as (typeof SURFACE_ORDER)[number]);
    return i === -1 ? 500 : i;
  };
  return [...map.entries()]
    .map(([key, tally]) => ({ key, tally }))
    .sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}

/** Buckets nach Basis (decided) absteigend, dann Schlüssel — für Kategorien. */
function orderByDecided(map: Map<string, Tally>): Bucket[] {
  return [...map.entries()]
    .map(([key, tally]) => ({ key, tally }))
    .sort((a, b) => b.tally.decided - a.tally.decided || a.key.localeCompare(b.key));
}

// ── Öffentliche Auswertungen ──────────────────────────────────────────────────
/**
 * Siegquoten: gesamt, nach Belag, nach Kategorie. Jede Gruppe trägt ihre Basis (decided).
 * `overall` zählt JEDES Match (auch Slug-Matches ohne Belag); die Belag-Aufschlüsselung
 * führt Slug-Matches im Eimer "unknown".
 */
export function winRates(matches: PerfMatch[]): WinRates {
  const overall = emptyTally();
  const surfaceMap = new Map<string, Tally>();
  const categoryMap = new Map<string, Tally>();

  for (const m of matches) {
    addMatch(overall, m.won);

    const sk = surfaceKey(m.surface);
    addMatch(surfaceMap.get(sk) ?? surfaceMap.set(sk, emptyTally()).get(sk)!, m.won);

    const ck = (m.category ?? "").trim() === "" ? UNKNOWN : m.category!.trim();
    addMatch(categoryMap.get(ck) ?? categoryMap.set(ck, emptyTally()).get(ck)!, m.won);
  }

  return {
    rulesVersion: PERFORMANCE_RULES_VERSION,
    overall,
    bySurface: orderSurfaceBuckets(surfaceMap),
    byCategory: orderByDecided(categoryMap),
  };
}

/** Bilanz je Saison (Siege/Niederlagen/offen), neueste Saison zuerst; unbekannte Saison zuletzt. */
export function seasonBalances(matches: PerfMatch[]): SeasonBalance[] {
  const map = new Map<number | null, SeasonBalance>();
  for (const m of matches) {
    const cur = map.get(m.season) ?? { season: m.season, wins: 0, losses: 0, open: 0 };
    if (m.won === true) cur.wins += 1;
    else if (m.won === false) cur.losses += 1;
    else cur.open += 1;
    map.set(m.season, cur);
  }
  return [...map.values()].sort((a, b) => {
    if (a.season == null) return 1;
    if (b.season == null) return -1;
    return b.season - a.season;
  });
}

/** Bilanz je Turnier, nach entschiedenen Matches absteigend, dann Name. */
export function tournamentBalances(matches: PerfMatch[]): TournamentBalance[] {
  const map = new Map<string, TournamentBalance>();
  for (const m of matches) {
    const cur = map.get(m.tournamentId) ?? { tournamentId: m.tournamentId, tournamentName: m.tournamentName, wins: 0, losses: 0, open: 0 };
    if (m.won === true) cur.wins += 1;
    else if (m.won === false) cur.losses += 1;
    else cur.open += 1;
    map.set(m.tournamentId, cur);
  }
  return [...map.values()].sort(
    (a, b) => (b.wins + b.losses) - (a.wins + a.losses) || a.tournamentName.localeCompare(b.tournamentName),
  );
}

/**
 * Zählende ATP-Punkte je Belag (aus scorePoints, Belag aus der Datenschicht angehängt).
 * Nur Einträge mit `counts=true` und Punkten>0 fließen ein — der Rest gibt keine Punkte.
 * `n` ist die Anzahl der Ergebnisse hinter der Summe (Grundlage). "unknown" für Slug-Turniere.
 */
export function pointsBySurface(entries: ScoredSurfaceEntry[]): PointsBySurface[] {
  const map = new Map<string, PointsBySurface>();
  for (const e of entries) {
    if (!e.counts || e.points <= 0) continue;
    const key = surfaceKey(e.surface);
    const cur = map.get(key) ?? { surface: key, points: 0, n: 0 };
    cur.points += e.points;
    cur.n += 1;
    map.set(key, cur);
  }
  const rank = (k: string): number => {
    if (k === UNKNOWN) return 999;
    const i = SURFACE_ORDER.indexOf(k as (typeof SURFACE_ORDER)[number]);
    return i === -1 ? 500 : i;
  };
  return [...map.values()].sort((a, b) => rank(a.surface) - rank(b.surface) || a.surface.localeCompare(b.surface));
}
