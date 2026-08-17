/**
 * Zuordnung eigener Reisedokumente zu einem Turnierland (Domain-Schicht, v1).
 *
 *   Reisedokumente + Zielland (ISO2) + „ist Schengen?"  →  passt ein Dokument, welches?
 *
 * Reine Funktionen: keine DB, kein Netzwerk, keine Systemzeit. Die Zuordnung läuft über den
 * GELTUNGSBEREICH (Land oder Schengen-Raum), NICHT über die Art — der Bestand klassifiziert
 * grob (US-ESTA liegt als requirement_class 'eta' vor), strenges Art-Matching würde gültige
 * Dokumente verstecken. Die Art bestimmt nur Label und Antragslink im UI.
 */
import type { TravelDocStatus, VisaRequirementClass } from "@/lib/types";

export const TRAVEL_DOC_MATCH_VERSION = "v1";

/** Klassen, für die überhaupt ein Dokument nötig ist. 'visa_free' braucht keins,
 *  'admission_refused' (Einreisesperre) hilft keins → beide false. */
export function needsDocument(rc: VisaRequirementClass): boolean {
  return rc === "eta" || rc === "evisa" || rc === "visa_on_arrival" || rc === "visa_required";
}

/** Deckt der Geltungsbereich eines Dokuments das Zielland? scope = ISO2-Land direkt,
 *  oder 'SCHENGEN', wenn das Zielland zum Schengen-Raum gehört. */
export function docCoversDestination(scope: string | null, destinationIso2: string, destinationIsSchengen: boolean): boolean {
  if (!scope || !destinationIso2) return false;
  if (scope === destinationIso2.toUpperCase()) return true;
  if (scope === "SCHENGEN" && destinationIsSchengen) return true;
  return false;
}

// Reihenfolge: „habe ich" schlägt „beantragt" schlägt „nicht vorhanden".
const STATUS_RANK: Record<TravelDocStatus, number> = { have: 0, applied: 1, none: 2 };

/**
 * Bestes passendes Dokument für ein Zielland (oder null). „Bestes": zuerst nach Status
 * (have < applied < none), bei Gleichstand das mit dem spätesten „gültig bis".
 */
export function bestDocumentFor<T extends { scope: string | null; status: TravelDocStatus; valid_until: string | null }>(
  docs: T[],
  destinationIso2: string,
  destinationIsSchengen: boolean,
): T | null {
  const matches = docs.filter((d) => docCoversDestination(d.scope, destinationIso2, destinationIsSchengen));
  if (matches.length === 0) return null;
  return matches.slice().sort((a, b) => {
    const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (s !== 0) return s;
    return (b.valid_until ?? "").localeCompare(a.valid_until ?? ""); // spätestes Datum zuerst
  })[0];
}
