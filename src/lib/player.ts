// Spielerprofil (lokal) + Eligibility-Logik: zeigt, für welche Turniere ein Spieler infrage kommt.
import { entryDeadline, type Surface, type Tier, type Tournament } from "./tournaments";

export type Gender = "m" | "w";

export type PlayerDocs = {
  passport: boolean;
  id: boolean;
  visa: boolean;
  license: boolean; // Spielerlizenz (ATP/ITF IPIN)
  federationLicense: boolean; // Verbandslizenz (z.B. DTB)
  medical: boolean; // Medical Certificate
  insurance: boolean;
  vaccination: boolean;
};

export type PlayerProfile = {
  firstName: string;
  lastName: string;
  nationality: string;
  homeCity: string;
  birthdate: string; // ISO yyyy-mm-dd
  gender: Gender;
  atp: number | null;
  wta: number | null;
  itf: number | null;
  utr: number | null;
  surface: Surface | null;
  homeAirport: string;
  rentalCar: boolean;
  docs: PlayerDocs;
};

export const EMPTY_PROFILE: PlayerProfile = {
  firstName: "",
  lastName: "",
  nationality: "",
  homeCity: "",
  birthdate: "",
  gender: "m",
  atp: null,
  wta: null,
  itf: null,
  utr: null,
  surface: null,
  homeAirport: "",
  rentalCar: false,
  docs: { passport: false, id: false, visa: false, license: false, federationLicense: false, medical: false, insurance: false, vaccination: false },
};

const KEY = "mu-player";
export function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROFILE;
    return { ...EMPTY_PROFILE, ...JSON.parse(raw), docs: { ...EMPTY_PROFILE.docs, ...(JSON.parse(raw).docs ?? {}) } };
  } catch {
    return EMPTY_PROFILE;
  }
}
export function saveProfile(p: PlayerProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function computeAge(birthdate: string): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate + "T00:00:00");
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

// Typische Direkt-/Quali-Cut-Offs (Einzel) + Mindestalter je Kategorie – Richtwerte,
// bis Live-Acceptance-Lists angebunden sind.
const CUT: Record<Tier, { direct: number; quali: number; minAge: number }> = {
  GS: { direct: 104, quali: 232, minAge: 14 },
  ATP1000: { direct: 60, quali: 120, minAge: 14 },
  ATP500: { direct: 45, quali: 110, minAge: 14 },
  ATP250: { direct: 95, quali: 240, minAge: 14 },
  CH125: { direct: 180, quali: 360, minAge: 14 },
  CH100: { direct: 220, quali: 420, minAge: 14 },
  CH75: { direct: 280, quali: 520, minAge: 14 },
  CH50: { direct: 350, quali: 650, minAge: 14 },
  ITF25: { direct: 700, quali: 1100, minAge: 15 },
  ITF15: { direct: 1000, quali: 1600, minAge: 15 },
};

export function rankForTier(p: PlayerProfile, tier: Tier): number | null {
  const isW = p.gender === "w";
  if (tier.startsWith("ITF")) return (isW ? p.wta : p.itf) ?? p.itf ?? (isW ? p.wta : p.atp);
  return isW ? p.wta : p.atp;
}

export type EligStatus = "green" | "yellow" | "red" | "unknown";
export type Eligibility = {
  status: EligStatus;
  label: string;
  reasons: { ok: boolean; text: string }[];
};

export function eligibility(p: PlayerProfile, t: Tournament): Eligibility {
  const cut = CUT[t.tier];
  const rank = rankForTier(p, t.tier);
  const age = computeAge(p.birthdate);
  const reasons: { ok: boolean; text: string }[] = [];

  if (rank == null) {
    return { status: "unknown", label: "Ranking fehlt", reasons: [{ ok: false, text: "Trage dein Ranking im Profil ein, um die Teilnahme zu prüfen." }] };
  }

  // Mindestalter
  const ageOk = age == null || age >= cut.minAge;
  reasons.push({ ok: ageOk, text: age == null ? `Mindestalter ${cut.minAge} (Geburtsdatum fehlt)` : ageOk ? `Mindestalter ${cut.minAge} erfüllt` : `Mindestalter ${cut.minAge} nicht erfüllt (du: ${age})` });

  // Ranking
  const direct = rank <= cut.direct;
  const quali = rank <= cut.quali;
  reasons.push({ ok: direct, text: direct ? `Hauptfeld: Ranking reicht (Cut-Off ~${cut.direct}, du: ${rank})` : `Hauptfeld: Cut-Off ~${cut.direct} · dein Ranking ${rank}` });
  if (!direct) reasons.push({ ok: quali, text: quali ? `Qualifikation möglich (Quali-Cut ~${cut.quali}, du: ${rank})` : `Auch Quali nicht erreichbar (Quali-Cut ~${cut.quali})` });

  // Meldeschluss
  const dl = entryDeadline(t);
  const dlOk = new Date() <= new Date(dl + "T23:59:59");
  reasons.push({ ok: dlOk, text: dlOk ? `Meldeschluss offen (bis ${dl})` : `Meldeschluss vorbei (${dl})` });

  let status: EligStatus;
  if (!ageOk) status = "red";
  else if (direct) status = "green";
  else if (quali) status = "yellow";
  else status = "red";

  const label = status === "green" ? "Teilnahme möglich" : status === "yellow" ? "Qualifikation möglich" : "Nicht möglich";
  return { status, label, reasons };
}

export const ELIG_COLOR: Record<EligStatus, string> = {
  green: "#16a34a",
  yellow: "#f59e0b",
  red: "#dc2626",
  unknown: "#94a3b8",
};

// Für jedes Turnier benötigte Standard-Dokumente (Profikreis). Erweiterbar je Turnier/Land.
export const DOC_LABELS: Record<keyof PlayerDocs, string> = {
  passport: "Reisepass",
  id: "Personalausweis",
  visa: "Visum",
  license: "Spielerlizenz",
  federationLicense: "Verbandslizenz",
  medical: "Medical Certificate",
  insurance: "Versicherung",
  vaccination: "Impfungen",
};
const REQUIRED: (keyof PlayerDocs)[] = ["passport", "license", "medical", "insurance"];
export function requiredDocs(_t: Tournament): (keyof PlayerDocs)[] {
  return REQUIRED;
}
export function missingDocs(p: PlayerProfile, t: Tournament): (keyof PlayerDocs)[] {
  return requiredDocs(t).filter((k) => !p.docs[k]);
}
