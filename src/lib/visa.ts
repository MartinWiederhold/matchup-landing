/**
 * Visa-/Einreise-Layer für den Tour-Modus. Ordnet jedem Reiseland ein „Regime"
 * (Schengen 90/180, UK ETA, US ESTA, Kanada eTA, Australien Subclass 408 …) samt
 * offiziellem Antragslink, Kosten, max. Aufenthalt und Doku-Checkliste zu und
 * erzeugt aus den geplanten Turnier-Ländern die offenen Visa-Fälle.
 *
 * WICHTIG: reine Planungs-/Checklisten-Hilfe auf Basis offizieller Quellen —
 * KEINE Rechtsberatung, keine einzelfallverbindliche Zusage. Ob deine Nationalität
 * konkret betroffen ist, immer offiziell prüfen. Regeln ändern sich laufend.
 */
import { isSchengen } from "@/lib/schengen";

export type VisaRegime = "schengen" | "uk_eta" | "esta" | "canada_eta" | "au_408" | "japan" | "check";

export type RegimeFacts = {
  officialUrl: string;
  /** feste Sachinfos, nicht übersetzt (Zahl/Preis) — Labels/Docs kommen aus i18n. */
  cost: string;
  maxStayDays: number | null;
};

/** Sachfakten je Regime. Texte/Checklisten werden im UI über i18n (mode.visa_*) gezogen. */
const FACTS: Record<VisaRegime, RegimeFacts> = {
  schengen: { officialUrl: "https://ec.europa.eu/assets/home/visa-calculator/calculator.htm", cost: "0 €", maxStayDays: 90 },
  uk_eta: { officialUrl: "https://www.gov.uk/apply-to-come-to-the-uk", cost: "£16", maxStayDays: 180 },
  esta: { officialUrl: "https://esta.cbp.dhs.gov/", cost: "$21", maxStayDays: 90 },
  canada_eta: { officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html", cost: "CA$7", maxStayDays: 180 },
  au_408: { officialUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-activity-408", cost: "≈A$405", maxStayDays: null },
  japan: { officialUrl: "https://www.mofa.go.jp/j_info/visit/visa/", cost: "—", maxStayDays: 90 },
  check: { officialUrl: "", cost: "—", maxStayDays: null },
};

export function regimeFacts(r: VisaRegime): RegimeFacts {
  return FACTS[r];
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}

const UK = new Set(["unitedkingdom", "vereinigteskonigreich", "grosbritannien", "greatbritain", "uk", "england", "scotland", "schottland", "wales"].map(norm));
const USA = new Set(["usa", "unitedstates", "unitedstatesofamerica", "vereinigtestaaten", "us", "amerika"].map(norm));
const CANADA = new Set(["canada", "kanada"].map(norm));
const AUS = new Set(["australia", "australien"].map(norm));
const JAPAN = new Set(["japan"].map(norm));

/** Regime für ein Reiseland. hasSchengenPass = EU/Schengen-Pass → Schengen entfällt (nur „check" fällt weg). */
export function countryRegime(country: string | null | undefined): VisaRegime {
  if (!country) return "check";
  if (isSchengen(country)) return "schengen";
  const n = norm(country);
  if (UK.has(n)) return "uk_eta";
  if (USA.has(n)) return "esta";
  if (CANADA.has(n)) return "canada_eta";
  if (AUS.has(n)) return "au_408";
  if (JAPAN.has(n)) return "japan";
  return "check";
}

export type VisaCase = { country: string; regime: VisaRegime };

/**
 * Erzeugt aus den geplanten Turnier-Ländern die offenen Visa-Fälle (dedupliziert).
 * Wenn der Spieler einen Schengen-/EU-Pass hat, werden Schengen-Länder ausgeblendet
 * (freie Einreise) — die 90/180-Auslastung wird separat in der Schengen-Projektion gezeigt.
 */
export function visaCases(countries: (string | null | undefined)[], hasSchengenPass: boolean): VisaCase[] {
  const seen = new Set<string>();
  const out: VisaCase[] = [];
  for (const c of countries) {
    if (!c) continue;
    const key = norm(c);
    if (seen.has(key)) continue;
    seen.add(key);
    const regime = countryRegime(c);
    if (regime === "schengen" && hasSchengenPass) continue;
    out.push({ country: c, regime });
  }
  return out;
}

/** Grobe Heuristik: hält der Spieler einen EU/Schengen-Pass? (aus passports[]). */
export function hasSchengenPassport(passports: string[]): boolean {
  return passports.some((p) => isSchengen(p));
}
