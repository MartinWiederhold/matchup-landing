/**
 * Nationalitätsabhängiger Visa-Bestand (web.tour_visa_requirements) — Lese-Layer für
 * den Tour-Modus. Steht BEWUSST NEBEN src/lib/visa.ts (dem zielland-basierten
 * Regime-Mapper); visa.ts bleibt unberührt.
 *
 * Liefert je Zielland (ISO-3166-1 alpha-2) die normierte Einreise-Klasse für die
 * Nationalität(en) des Spielers, plus Aufenthaltsdauer, Quelllink und Datenstand.
 *
 * WICHTIG: Referenz aus Wikipedia, KEINE amtliche Auskunft. Der Hinweis „beim Konsulat
 * prüfen" gehört an JEDE Aussage — auch an „visumfrei" und an eine fehlende Angabe
 * (dort ist er das Einzige, was es zu sagen gibt). Die Anzeige erzwingt das.
 */
import { supabase } from "@/lib/supabase";
import type { TourVisaRequirement, VisaRequirementClass } from "@/lib/types";

export type NatVisaInfo = {
  nationality: string;                 // ISO-3166-1 alpha-2 (der maßgebliche Pass)
  destination: string;                 // ISO-3166-1 alpha-2
  requirementClass: VisaRequirementClass;
  allowedStayDays: number | null;
  sourceUrl: string;
  sourceRevisedAt: string | null;      // ISO timestamp: Seite zuletzt geändert
  importedAt: string;                  // ISO timestamp: wann wir importiert haben
};

/** Rangfolge von „am freizügigsten" (0) zu „gesperrt" (5). Beim Zusammenführen
 *  mehrerer Pässe gewinnt der NIEDRIGSTE Rang — kann der Spieler mit irgendeinem
 *  Pass leichter einreisen, zählt das. Eine Sperre gilt daher nur, wenn ALLE Pässe
 *  gesperrt sind. */
const RANK: Record<VisaRequirementClass, number> = {
  visa_free: 0,
  eta: 1,
  visa_on_arrival: 2,
  evisa: 3,
  visa_required: 4,
  admission_refused: 5,
};

function toInfo(row: TourVisaRequirement): NatVisaInfo {
  return {
    nationality: row.nationality,
    destination: row.destination,
    requirementClass: row.requirement_class,
    allowedStayDays: row.allowed_stay_days,
    sourceUrl: row.source_url,
    sourceRevisedAt: row.source_revised_at,
    importedAt: row.imported_at,
  };
}

/** Alle Zeilen für EINE Nationalität → Map destination(ISO2) → NatVisaInfo. */
export async function loadVisaForNationality(nationality: string): Promise<Map<string, NatVisaInfo>> {
  const nat = nationality.trim().toUpperCase();
  const out = new Map<string, NatVisaInfo>();
  if (!/^[A-Z]{2}$/.test(nat)) return out;
  const { data } = await supabase
    .from("tour_visa_requirements")
    .select("id,nationality,destination,requirement_class,allowed_stay_days,source_url,source_revised_at,imported_at,created_at,updated_at")
    .eq("nationality", nat);
  for (const row of (data as TourVisaRequirement[] | null) ?? []) out.set(row.destination, toInfo(row));
  return out;
}

/**
 * Effektive Auskunft über ein oder zwei Pässe: je Zielland gewinnt die günstigste
 * Klasse (niedrigster Rang). Rückgabe: Map destination(ISO2) → NatVisaInfo des
 * jeweils günstigeren Passes.
 */
export async function loadEffectiveVisa(passports: string[]): Promise<Map<string, NatVisaInfo>> {
  const nats = [...new Set(passports.map((p) => p.trim().toUpperCase()).filter((p) => /^[A-Z]{2}$/.test(p)))];
  const merged = new Map<string, NatVisaInfo>();
  for (const nat of nats) {
    const one = await loadVisaForNationality(nat);
    for (const [dest, info] of one) {
      const cur = merged.get(dest);
      if (!cur || RANK[info.requirementClass] < RANK[cur.requirementClass]) merged.set(dest, info);
    }
  }
  return merged;
}

/**
 * Ziel-Länder (ISO2), für die JEDER Pass eine Einreisesperre trägt — das Sperr-Set
 * für den Saison-Optimierer (OptimizeInput.entryBanned). Aus loadEffectiveVisa
 * abgeleitet: effektive Klasse = admission_refused heißt, kein Pass lässt einreisen.
 */
export async function bannedDestinations(passports: string[]): Promise<Set<string>> {
  const eff = await loadEffectiveVisa(passports);
  const banned = new Set<string>();
  for (const [dest, info] of eff) if (info.requirementClass === "admission_refused") banned.add(dest);
  return banned;
}
