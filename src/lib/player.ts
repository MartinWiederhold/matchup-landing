// Spielerprofil (lokal) + Eligibility-Logik: zeigt, für welche Turniere ein Spieler infrage kommt.
import { entryDeadline, type Surface, type Tier, type Tournament } from "./tournaments";
import { supabase } from "./supabase";

export type Gender = "m" | "w";

export type PlayerDocs = {
  passport: boolean;
  id: boolean;
  visa: boolean;
  ipin: boolean; // IPIN / World Tennis ID (Pflicht für ITF-Events)
  playerEducation: boolean; // ITF Player Education Course
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
  avatar: string; // Profilbild als komprimierter Data-URL (leer = keins)
  atp: number | null;
  wta: number | null;
  itf: number | null;
  utr: number | null;
  wtn: number | null; // ITF World Tennis Number (1–40, niedriger = besser)
  surface: Surface | null;
  homeAirport: string;
  rentalCar: boolean;
  contact: string; // opt-in Kontakt für Trainingspartner-Vermittlung (z.B. @insta / WhatsApp)
  docs: PlayerDocs;
};

export const EMPTY_PROFILE: PlayerProfile = {
  firstName: "",
  lastName: "",
  nationality: "",
  homeCity: "",
  birthdate: "",
  gender: "m",
  avatar: "",
  atp: null,
  wta: null,
  itf: null,
  utr: null,
  wtn: null,
  surface: null,
  homeAirport: "",
  rentalCar: false,
  contact: "",
  docs: { passport: false, id: false, visa: false, ipin: false, playerEducation: false, license: false, federationLicense: false, medical: false, insurance: false, vaccination: false },
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

function mergeProfile(d: Partial<PlayerProfile> | null | undefined): PlayerProfile {
  return { ...EMPTY_PROFILE, ...(d ?? {}), docs: { ...EMPTY_PROFILE.docs, ...(d?.docs ?? {}) } };
}

// ── Spieler-Präsenz „Wer ist diese Woche hier?" + Trainingspartner (opt-in) ──────
export type Presence = {
  user_id: string;
  tournament_id: string;
  name: string | null;
  rank_label: string | null;
  nationality: string | null;
  surface: string | null;
  gender: string | null;
  looking: boolean;
  contact: string | null;
  updated_at: string;
};

export function rankLabel(p: PlayerProfile): string {
  if (p.atp) return `ATP ${p.atp}`;
  if (p.wta) return `WTA ${p.wta}`;
  if (p.itf) return `ITF ${p.itf}`;
  if (p.wtn) return `WTN ${p.wtn}`;
  return "kein Ranking";
}

export async function loadPresence(tournamentId: string): Promise<Presence[]> {
  try {
    const { data, error } = await supabase
      .from("player_presence")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("looking", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data as Presence[]) ?? [];
  } catch {
    return [];
  }
}

export async function joinPresence(userId: string, tournamentId: string, p: PlayerProfile, looking: boolean, contact: string): Promise<boolean> {
  try {
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Spieler";
    const { error } = await supabase.from("player_presence").upsert(
      {
        user_id: userId, tournament_id: tournamentId, name, rank_label: rankLabel(p),
        nationality: p.nationality || null, surface: p.surface, gender: p.gender,
        looking, contact: contact.trim() || null, updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tournament_id" },
    );
    return !error;
  } catch {
    return false;
  }
}

export async function leavePresence(userId: string, tournamentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("player_presence").delete().eq("user_id", userId).eq("tournament_id", tournamentId);
    return !error;
  } catch {
    return false;
  }
}

/** UID der aktiven App-Anmeldung (dieselbe Supabase-Session wie die Haupt-App), sonst null. */
export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Profil des angemeldeten Nutzers aus web.player_profiles laden (RLS: nur eigenes). */
export async function loadProfileRemote(userId: string): Promise<PlayerProfile | null> {
  try {
    const { data, error } = await supabase.from("player_profiles").select("data").eq("user_id", userId).maybeSingle();
    if (error || !data) return null;
    return mergeProfile(data.data as Partial<PlayerProfile>);
  } catch {
    return null;
  }
}

/** Profil des angemeldeten Nutzers in web.player_profiles speichern (geräteübergreifend). */
export async function saveProfileRemote(userId: string, p: PlayerProfile): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("player_profiles")
      .upsert({ user_id: userId, data: p, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    return !error;
  } catch {
    return false;
  }
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

/**
 * Cut-Off je Turnier: offizielle Werte (aus Meldeliste, in DB gepflegt) haben Vorrang,
 * sonst kalibrierter Richtwert aus dem Kategorie-Modell (CUT). `official` steuert die Beschriftung.
 */
export function cutoffFor(t: Tournament): { direct: number; quali: number; minAge: number; official: boolean } {
  const base = CUT[t.tier];
  if (t.cutDirect != null && t.cutQuali != null) {
    return { direct: t.cutDirect, quali: t.cutQuali, minAge: base.minAge, official: true };
  }
  return { direct: base.direct, quali: base.quali, minAge: base.minAge, official: false };
}

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
  const cut = cutoffFor(t);
  const rank = rankForTier(p, t.tier);
  const age = computeAge(p.birthdate);
  const reasons: { ok: boolean; text: string }[] = [];

  if (rank == null) {
    return { status: "unknown", label: "Ranking fehlt", reasons: [{ ok: false, text: "Trage dein Ranking im Profil ein, um die Teilnahme zu prüfen." }] };
  }

  // Mindestalter
  const ageOk = age == null || age >= cut.minAge;
  reasons.push({ ok: ageOk, text: age == null ? `Mindestalter ${cut.minAge} (Geburtsdatum fehlt)` : ageOk ? `Mindestalter ${cut.minAge} erfüllt` : `Mindestalter ${cut.minAge} nicht erfüllt (du: ${age})` });

  // Ranking — Cut-Off offiziell (Meldeliste) oder Richtwert
  const tag = cut.official ? "offiziell" : "Richtwert";
  const direct = rank <= cut.direct;
  const quali = rank <= cut.quali;
  reasons.push({ ok: direct, text: direct ? `Hauptfeld: Ranking reicht (Cut-Off ~${cut.direct}, ${tag} · du: ${rank})` : `Hauptfeld: Cut-Off ~${cut.direct} (${tag}) · dein Ranking ${rank}` });
  if (!direct) reasons.push({ ok: quali, text: quali ? `Qualifikation möglich (Quali-Cut ~${cut.quali}, ${tag} · du: ${rank})` : `Auch Quali nicht erreichbar (Quali-Cut ~${cut.quali}, ${tag})` });

  // Meldeschluss (ITF: Donnerstag 14:00 GMT, 18 Tage vorher)
  const dl = entryDeadline(t);
  const dlHint = t.tier.startsWith("ITF") ? " (Do. 14:00 GMT)" : "";
  const dlOk = new Date() <= new Date(dl + "T23:59:59");
  reasons.push({ ok: dlOk, text: dlOk ? `Meldeschluss offen (bis ${dl}${dlHint})` : `Meldeschluss vorbei (${dl})` });

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
  ipin: "IPIN / World Tennis ID",
  playerEducation: "Player Education Course",
  license: "Spielerlizenz",
  federationLicense: "Verbandslizenz",
  medical: "Medical Certificate",
  insurance: "Versicherung",
  vaccination: "Impfungen",
};
// ITF (M15/M25) verlangt IPIN/World Tennis ID + Player Education Course statt ATP-Lizenz/Medical.
const REQUIRED_ITF: (keyof PlayerDocs)[] = ["passport", "ipin", "playerEducation", "insurance"];
const REQUIRED_PRO: (keyof PlayerDocs)[] = ["passport", "license", "medical", "insurance"];
export function requiredDocs(t: Tournament): (keyof PlayerDocs)[] {
  return t.tier.startsWith("ITF") ? REQUIRED_ITF : REQUIRED_PRO;
}
export function missingDocs(p: PlayerProfile, t: Tournament): (keyof PlayerDocs)[] {
  return requiredDocs(t).filter((k) => !p.docs[k]);
}

// Strategie-Empfehlung nach Ranking (aus der Tour-Analyse: welcher Level ist sinnvoll?).
export type Strategy = { headline: string; focus: string; note: string; group: "ITF" | "Challenger" | "ATP" };
export function strategyFor(p: PlayerProfile): Strategy {
  const rank = p.gender === "w" ? p.wta : p.atp;
  if (rank == null) {
    return {
      headline: "Einstieg – noch kein ATP-Ranking",
      focus: "ITF M15-Quali im Cluster (Monastir / Antalya / Ägypten)",
      note: "Aufnahme über WTN bzw. nationale Rangliste. Ziel: erste ATP-Punkte, Quali regelmäßig überstehen. Clustern spart Reisekosten.",
      group: "ITF",
    };
  }
  if (rank > 1000) return { headline: `Rang ${rank}`, focus: "ITF M15 (Quali → Hauptfeld) im Cluster", note: "Punkte sammeln, konsequent clustern. Kostendeckend noch unmöglich → Liga-/Sponsoren-Finanzierung.", group: "ITF" };
  if (rank > 700) return { headline: `Rang ${rank}`, focus: "M15 Hauptfeld + erste M25-Quali", note: "Matchvolumen aufbauen; M25 erst, wenn die Quali realistisch übersteht.", group: "ITF" };
  if (rank > 500) return { headline: `Rang ${rank}`, focus: "M25 (Ziel Halbfinals) + erste Challenger-Quali", note: "M25-Halbfinale deckt eine Woche klar. Challenger-Quali nur bei realistischer Match-Chance.", group: "ITF" };
  if (rank > 250) return { headline: `Rang ${rank}`, focus: "Challenger-Hauptfelder + M25-Titel", note: "Challenger-Reisen dominieren – Budget/Team hochskalieren (15k € reichen hier nicht mehr).", group: "Challenger" };
  if (rank > 100) return { headline: `Rang ${rank}`, focus: "ATP 250/500-Quali + Challenger 125", note: "Erste wirtschaftliche Tragfähigkeit bei striktem Kostenmanagement.", group: "Challenger" };
  return { headline: `Rang ${rank} – Top 100`, focus: "ATP Tour (250/500/1000) + Grand Slams", note: "Direkte Hauptfeld-Aufnahme; Preisgeld meist profitabel.", group: "ATP" };
}
