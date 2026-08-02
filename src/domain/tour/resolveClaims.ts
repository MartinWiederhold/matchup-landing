/**
 * Auflösung von Feld-Behauptungen (Claims) zu EINEM Turnierfeld (Domain-Schicht, v1).
 *
 *   Liste von Claims (Wert + Quelle + Zeitpunkt + Confidence)  →  gewählter Wert
 *   + gewählte Quelle + berechneter Vertrauenswert + Konfliktkennzeichen
 *
 * Reine Funktion: keine DB, kein Netzwerk, KEINE Systemzeit (kein `new Date()`/
 * `Date.now()`). Alles Nötige wird hereingereicht; gleiche Eingabe ⇒ gleiche Ausgabe
 * (per Unit-Test abgesichert). Rückgaben tragen nur Codes, keine Sätze — Übersetzung
 * passiert später in der UI über i18n.
 *
 * Zweck: Sobald mehrere Quellen (Verbandskalender, Wikipedia, Ableitungen) dasselbe
 * Feld behaupten, darf NICHT die Reihenfolge der Importläufe entscheiden, welcher
 * Wert im Stamm landet — sondern diese nachvollziehbare Regel.
 */

export const RESOLVE_RULES_VERSION = "v1";

/**
 * Quellen-Rangfolge als benannte Konstante (höchster Rang zuerst). Verglichen wird
 * über das PRÄFIX der Quelle: z. B. "verband_dtb_2026" beginnt mit "verband".
 * Unbekannte Präfixe erhalten den niedrigsten Rang (nach allen bekannten).
 */
export const SOURCE_RANK = ["verband", "wikipedia", "abgeleitet"] as const;

/** Parameter der Vertrauensberechnung — zentral, damit spätere Versionen nachvollziehbar sind. */
const AGREE_BONUS = 0.05; // je zusätzlichem übereinstimmenden Claim (Top-Rang)
const CONFLICT_PENALTY = 0.15; // Abzug, wenn sich Quellen widersprechen

export type FieldClaim = {
  field_value: string;
  source: string;
  observed_at: string; // ISO-8601 UTC (lexikografisch = chronologisch)
  confidence: number; // 0..1
};

export type Resolution = {
  value: string | null; // gewählter Wert (null, wenn keine Claims)
  source: string | null; // Quelle des gewählten Werts
  confidence: number; // berechneter Vertrauenswert 0..1
  conflict: boolean; // true, sobald sich mindestens zwei Quellen im Wert widersprechen
  rulesVersion: string;
  notes: string[]; // Entscheidungs-Codes (z. B. "by_rank", "conflict"), keine Sätze
};

/** Rang einer Quelle (kleiner = höher priorisiert). Unbekannt → hinter allen bekannten. */
function rankOf(source: string): number {
  const i = SOURCE_RANK.findIndex((prefix) => source.startsWith(prefix));
  return i < 0 ? SOURCE_RANK.length : i;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Löst die Claims eines einzelnen Feldes auf.
 *
 * Regel, in dieser Reihenfolge:
 *   a) Quellen-Rang (SOURCE_RANK) — höherer Rang gewinnt.
 *   b) Bei gleichem Rang: jüngeres observed_at gewinnt.
 *   c) Bei Gleichstand: der Wert mit MEHR übereinstimmenden Claims (im Top-Rang) gewinnt.
 *   d) Bleibt es unentschieden: höhere confidence gewinnt (und wird als Konflikt geführt).
 * Ein Widerspruch (≥2 unterschiedliche Werte) wird IMMER gekennzeichnet.
 */
export function resolveClaimField(claims: FieldClaim[]): Resolution {
  if (claims.length === 0) {
    return { value: null, source: null, confidence: 0, conflict: false, rulesVersion: RESOLVE_RULES_VERSION, notes: ["no_claims"] };
  }

  const distinctValues = new Set(claims.map((c) => c.field_value));
  const conflict = distinctValues.size > 1;
  const notes: string[] = [];

  // Nur EIN Claim bzw. alle einig → direkte Entscheidung.
  if (claims.length === 1) notes.push("single");
  else if (!conflict) notes.push("unanimous");

  // a) Auf den besten (kleinsten) Rang filtern.
  const bestRank = Math.min(...claims.map((c) => rankOf(c.source)));
  const pool = claims.filter((c) => rankOf(c.source) === bestRank);

  // Kandidatenwerte stufenweise einengen; Entscheidungs-Code festhalten.
  let candidateValues = new Set(pool.map((c) => c.field_value));
  if (conflict) {
    if (candidateValues.size === 1) {
      notes.push("by_rank");
    } else {
      // b) jüngstes observed_at im Pool.
      const maxTs = pool.reduce((m, c) => (c.observed_at > m ? c.observed_at : m), pool[0].observed_at);
      const poolTime = pool.filter((c) => c.observed_at === maxTs);
      const timeValues = new Set(poolTime.map((c) => c.field_value));
      if (timeValues.size === 1) {
        notes.push("by_time");
        candidateValues = timeValues;
      } else {
        // c) Wert mit den meisten übereinstimmenden Claims im Pool.
        const count = new Map<string, number>();
        for (const c of pool) count.set(c.field_value, (count.get(c.field_value) ?? 0) + 1);
        const maxCount = Math.max(...count.values());
        const topByCount = [...count.entries()].filter(([, n]) => n === maxCount).map(([v]) => v);
        if (topByCount.length === 1) {
          notes.push("by_support");
          candidateValues = new Set(topByCount);
        } else {
          // d) höchste confidence entscheidet.
          notes.push("by_confidence");
          candidateValues = new Set(topByCount);
        }
      }
    }
  }

  // Repräsentativen Claim des Gewinnerwerts wählen: höchster Rang (=Pool) → jüngstes
  // observed_at → höchste confidence → deterministischer Tiebreak (Wert, dann Quelle).
  const finalists = pool.filter((c) => candidateValues.has(c.field_value));
  finalists.sort((a, b) =>
    (b.observed_at > a.observed_at ? 1 : b.observed_at < a.observed_at ? -1 : 0) ||
    (b.confidence - a.confidence) ||
    (a.field_value < b.field_value ? -1 : a.field_value > b.field_value ? 1 : 0) ||
    (a.source < b.source ? -1 : a.source > b.source ? 1 : 0),
  );
  const winner = finalists[0];

  // Berechneter Vertrauenswert: Confidence des Gewinners, +Bonus je zusätzlichem
  // übereinstimmenden Top-Rang-Claim, −Abzug bei Widerspruch. Gedeckelt auf [0,1].
  const agreeing = pool.filter((c) => c.field_value === winner.field_value).length;
  const confidence = round2(
    clamp01(winner.confidence + AGREE_BONUS * (agreeing - 1) - (conflict ? CONFLICT_PENALTY : 0)),
  );

  if (conflict) notes.push("conflict");

  return { value: winner.field_value, source: winner.source, confidence, conflict, rulesVersion: RESOLVE_RULES_VERSION, notes };
}
