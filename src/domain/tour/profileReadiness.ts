/**
 * Lücken im Tour-Profil: nur belegte Felder und Kalenderdaten.
 * KEINE Akzeptanzchance, keine Visa-Pflicht, keine Ampel ohne Datum.
 * Getestet in profileReadiness.test.ts. nowISO als Parameter — keine Systemuhr.
 */

export const DOC_WARN_DAYS = 60;
const DAY = 86_400_000;

export type ProfileGap =
  | { kind: "home" }
  | { kind: "nationality" }
  | { kind: "rates" }
  | { kind: "passport_date" }
  | { kind: "passport_expired"; days: number }
  | { kind: "passport_expiring"; days: number }
  | { kind: "insurance_expired"; days: number }
  | { kind: "insurance_expiring"; days: number };

/** Ganze UTC-Tage von nowISO bis dateISO (negativ = vorbei). */
export function daysUntil(dateISO: string, nowISO: string): number {
  return Math.ceil((Date.parse(dateISO + "T00:00:00Z") - Date.parse(nowISO + "T00:00:00Z")) / DAY);
}

function dateGaps(
  expiry: string | null,
  nowISO: string,
  expired: "passport_expired" | "insurance_expired",
  expiring: "passport_expiring" | "insurance_expiring",
): ProfileGap[] {
  if (!expiry) return [];
  const days = daysUntil(expiry, nowISO);
  if (days < 0) return [{ kind: expired, days }];
  if (days <= DOC_WARN_DAYS) return [{ kind: expiring, days }];
  return [];
}

export function profileGaps(input: {
  nowISO: string;
  hasHome: boolean;
  hasNationality: boolean;
  hasRates: boolean;
  passportCountry: string | null;
  passportExpiry: string | null;
  insuranceExpiry: string | null;
}): ProfileGap[] {
  const out: ProfileGap[] = [];
  if (!input.hasHome) out.push({ kind: "home" });
  if (!input.hasNationality) out.push({ kind: "nationality" });
  if (input.passportCountry && !input.passportExpiry) out.push({ kind: "passport_date" });
  out.push(...dateGaps(input.passportExpiry, input.nowISO, "passport_expired", "passport_expiring"));
  out.push(...dateGaps(input.insuranceExpiry, input.nowISO, "insurance_expired", "insurance_expiring"));
  if (!input.hasRates) out.push({ kind: "rates" });
  return out;
}
