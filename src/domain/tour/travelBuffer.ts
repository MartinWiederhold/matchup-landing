/**
 * Reise-Puffer zwischen Turnieren (reine Logik, KEINE UI/DB). Getestet in travelBuffer.test.ts.
 *
 * Ein Turnier belegt eine feste Woche Mo–So; realistisch endet es spätestens am Sonntag
 * (Finale). Ruhetage bis zum Start des nächsten (Montag) = (BMontag − AMontag) − 6.
 * Zwei Rücken-an-Rücken-Wochen lassen also ~1 Übergangstag; eine Ruhewoche dazwischen ⇒ 8.
 *
 * Puffer wird NUR zwischen VERSCHIEDENEN Orten gebraucht — am selben Ort ist man schon da
 * (derselbe Cluster-Gedanke wie bei den Kosten, place = "country|city").
 *
 * Ehrliche Grenze: Wir kennen Distanz (Koordinaten), aber NICHT die Reisezeit (Zug vs.
 * Flug mit Umstieg). Der Puffer ist deshalb eine Nutzerangabe in Tagen, keine berechnete
 * Reisezeit — und wirkt wegen der Wochen-Granularität praktisch als „Ruhewoche ja/nein".
 */

const DAY = 86_400_000;

/** Ruhetage zwischen dem Ende von A (Sonntag) und dem Start von B (Montag). Beide Montage in ms (UTC). */
export function restDaysBetween(aMondayMs: number, bMondayMs: number): number {
  return Math.round((bMondayMs - aMondayMs) / DAY) - 6;
}

/** Enger Übergang: verschiedene Orte UND Ruhetage < Puffer. Gleicher Ort ⇒ nie eng (Cluster). */
export function isTightLeg(
  aPlace: string | null,
  aMondayMs: number,
  bPlace: string | null,
  bMondayMs: number,
  bufferDays: number,
): boolean {
  if (aPlace != null && aPlace === bPlace) return false; // Cluster: kein Puffer nötig
  return restDaysBetween(aMondayMs, bMondayMs) < bufferDays;
}

export interface SeasonLeg {
  id: string;
  place: string | null; // "country|city" oder null (kein Ortsschlüssel → nie clustern)
  mondayMs: number; // tournament_monday als UTC-ms
}

/**
 * Enge Übergänge in einer CHRONOLOGISCH sortierten Saison. Markiert wird das ANKOMMENDE
 * Turnier (das zweite jedes engen Nachbarpaares) → Map id → verbleibende Ruhetage.
 * Nur benachbarte Paare (Reise-Reihenfolge); nichts wird entfernt, nur gemeldet.
 */
export function tightArrivals<T extends SeasonLeg>(sortedByMonday: T[], bufferDays: number): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 1; i < sortedByMonday.length; i++) {
    const a = sortedByMonday[i - 1];
    const b = sortedByMonday[i];
    if (isTightLeg(a.place, a.mondayMs, b.place, b.mondayMs, bufferDays)) {
      out.set(b.id, restDaysBetween(a.mondayMs, b.mondayMs));
    }
  }
  return out;
}
