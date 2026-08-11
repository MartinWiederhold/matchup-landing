import { supabase } from "@/lib/supabase";
import type { TourProfile } from "@/lib/types";

/* Tour ist vorerst gesperrt (Early Access). Freischaltung via WaitlistScreen-Code.
 *
 * BEWUSST NICHT persistent: die Freischaltung lebt nur im Speicher dieser Sitzung
 * (kein localStorage). So sieht jeder beim Wechsel zu Compete IMMER wieder die
 * Warteliste und muss den Code 50805080 erneut eingeben — und Besucher können
 * ihre Mail eintragen (landet in web.waitlist → Admin). Beim Reload und beim
 * Zurueckwechseln zu Play (lockTour) wird wieder gesperrt. */
let unlockedThisSession = false;
/** unlockTour()/lockTour() feuern dieses Event, damit die Shell sofort nachzieht. */
export const TOUR_UNLOCK_EVENT = "mu-tour-unlock";

/* Compete/Earth hinter der Warteliste — Freischaltung nur mit Code 50805080.
 * (Zum offenen Testen ggf. temporär auf true; Genutzt in tourUnlocked() und EarthTab.) */
export const COMPETE_EARLY_ACCESS_OPEN = false;

export function tourUnlocked(): boolean {
  if (COMPETE_EARLY_ACCESS_OPEN) return true;
  return unlockedThisSession;
}
export function unlockTour(): void {
  unlockedThisSession = true;
  try { window.dispatchEvent(new Event(TOUR_UNLOCK_EVENT)); } catch { /* ignore */ }
}
/** Wieder sperren (z.B. beim Zurueckwechseln zu Play) → Compete fragt erneut. */
export function lockTour(): void {
  unlockedThisSession = false;
  try { window.dispatchEvent(new Event(TOUR_UNLOCK_EVENT)); } catch { /* ignore */ }
}

/** Lädt das Tour-Profil des Users (oder null, wenn noch keins existiert). */
export async function loadTourProfile(userId: string): Promise<TourProfile | null> {
  const { data } = await supabase
    .from("tour_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as TourProfile | null) ?? null;
}

/** Legt das Tour-Profil an bzw. aktualisiert es (Upsert). */
export async function saveTourProfile(
  userId: string,
  patch: Partial<Omit<TourProfile, "user_id">>,
): Promise<void> {
  await supabase
    .from("tour_profiles")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}

/** Wechselt den Modus (play/tour) am Profil. */
export async function setMode(userId: string, mode: "play" | "tour"): Promise<void> {
  await supabase.from("profiles").update({ mode }).eq("id", userId);
}

/* ── Kalender-Feed (iCal-Abo) ─────────────────────────────── */
export async function ensureCalendarToken(userId: string): Promise<string> {
  const { data } = await supabase.from("tour_calendar").select("token").eq("user_id", userId).maybeSingle();
  const existing = data?.token as string | undefined;
  if (existing) return existing;
  const token = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.round(Math.random() * 1e9)}`).replace(/-/g, "");
  await supabase.from("tour_calendar").upsert({ user_id: userId, token }, { onConflict: "user_id" });
  return token;
}
export function calendarFeedUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://matchup-app.com";
  return `${origin}/api/tour/calendar/${token}.ics`;
}

/* ── Team-Chat ─────────────────────────────────────────────── */
export type TourMessage = { id: string; sender_id: string; sender_name: string | null; body: string; created_at: string };

export async function loadMessages(teamOwner: string): Promise<TourMessage[]> {
  const { data } = await supabase
    .from("tour_messages")
    .select("id,sender_id,sender_name,body,created_at")
    .eq("team_owner", teamOwner)
    .order("created_at")
    .limit(200);
  return (data as TourMessage[]) ?? [];
}

export async function sendMessage(teamOwner: string, senderId: string, senderName: string, body: string): Promise<void> {
  await supabase.from("tour_messages").insert({ team_owner: teamOwner, sender_id: senderId, sender_name: senderName, body });
}

/* ── Reise-Autorisierungen (Visa/ESTA/ETA) ────────────────── */
export type TravelDoc = { id: string; kind: string; country: string | null; status: string; expiry: string | null; ref: string | null };

export async function loadTravelDocs(userId: string): Promise<TravelDoc[]> {
  const { data } = await supabase
    .from("tour_visa")
    .select("id,kind,country,status,expiry,ref")
    .eq("user_id", userId)
    .order("expiry", { nullsFirst: false });
  return (data as TravelDoc[]) ?? [];
}

export async function saveTravelDoc(
  userId: string,
  doc: { id?: string; kind: string; country: string | null; status: string; expiry: string | null; ref: string | null },
): Promise<void> {
  const payload = { kind: doc.kind, country: doc.country, status: doc.status, expiry: doc.expiry, ref: doc.ref, updated_at: new Date().toISOString() };
  if (doc.id) {
    await supabase.from("tour_visa").update(payload).eq("id", doc.id);
  } else {
    await supabase.from("tour_visa").insert({ user_id: userId, ...payload });
  }
}

export async function removeTravelDoc(id: string): Promise<void> {
  await supabase.from("tour_visa").delete().eq("id", id);
}

/* ── Team-Einladungen ─────────────────────────────────────── */
export type TeamInvite = { id: string; role: string; member_name: string | null; status: string; invite_token: string | null; created_at: string; invite_expires_at: string | null };

export async function loadTeam(playerId: string): Promise<TeamInvite[]> {
  const { data } = await supabase
    .from("tour_team")
    .select("id,role,member_name,status,invite_token,created_at,invite_expires_at")
    .eq("player_id", playerId);
  return (data as TeamInvite[]) ?? [];
}

/** Status einer Einladung für die Anzeige (MU-027): aktiv (Mitglied beigetreten),
 *  offen (Token gültig), abgelaufen (Token da, aber Frist vorbei). `nowMs` wird von
 *  der Komponente hereingereicht (kein Laufzeit-Clock in Render). */
export function inviteState(inv: TeamInvite, nowMs: number): "active" | "open" | "expired" | "none" {
  if (inv.status === "active" || inv.member_name) return "active";
  if (!inv.invite_token) return "none";
  if (inv.invite_expires_at && new Date(inv.invite_expires_at).getTime() < nowMs) return "expired";
  return "open";
}

/** Erzeugt (oder liefert) einen Einladungs-Token für eine Rolle. */
function newInviteToken(): string {
  return (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.round(Math.random() * 1e9)}`).replace(/-/g, "");
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

/**
 * Einladungslink für eine Rolle erzeugen/holen (MU-027). Eine noch OFFENE (nicht
 * angenommene) und GÜLTIGE Einladung wird wiederverwendet; ist sie abgelaufen, wird
 * sie rotiert (neuer Token + neues Ablaufdatum). Angenommene Einladungen (member_user_id
 * gesetzt, Token per accept-invite entwertet) werden nie angefasst — dann entsteht eine
 * frische offene Einladung. Ablaufdatum: now()+7 Tage.
 */
export async function ensureInvite(playerId: string, role: string): Promise<string> {
  const nowIso = new Date().toISOString();
  const expiry = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const { data } = await supabase
    .from("tour_team")
    .select("id, invite_token, invite_expires_at")
    .eq("player_id", playerId)
    .eq("role", role)
    .is("member_user_id", null)
    .not("invite_token", "is", null)
    .limit(1);
  const open = data?.[0] as { id: string; invite_token: string; invite_expires_at: string | null } | undefined;
  const token = newInviteToken();
  if (open) {
    // Noch gültig → wiederverwenden; abgelaufen → rotieren.
    if (open.invite_expires_at && open.invite_expires_at > nowIso) return open.invite_token;
    await supabase.from("tour_team").update({ invite_token: token, invite_expires_at: expiry }).eq("id", open.id);
    return token;
  }
  await supabase.from("tour_team").insert({ player_id: playerId, role, invite_token: token, invite_expires_at: expiry });
  return token;
}

export async function removeInvite(id: string): Promise<void> {
  await supabase.from("tour_team").delete().eq("id", id);
}

export function inviteUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://matchup-app.com";
  return `${origin}/app?team=${token}`;
}

/** Spieler, die mich in ihr Team eingeladen haben (ich bin Coach/Physio/Agent…). */
export type MyPlayer = { player_id: string; role: string; player_name: string | null };
export async function loadMyPlayers(userId: string): Promise<MyPlayer[]> {
  const { data } = await supabase
    .from("tour_team")
    .select("player_id, role")
    .eq("member_user_id", userId)
    .eq("status", "active");
  const rows = (data ?? []) as { player_id: string; role: string }[];
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.player_id))];
  const { data: profs } = await supabase.from("profiles").select("id, first_name").in("id", ids);
  const nameMap = new Map((profs ?? []).map((p) => [p.id as string, p.first_name as string | null]));
  return rows.map((r) => ({ player_id: r.player_id, role: r.role, player_name: nameMap.get(r.player_id) ?? null }));
}

/** Nimmt eine Einladung an (verknüpft den eingeloggten Nutzer mit dem Spieler). */
export async function acceptInvite(token: string): Promise<{ ok?: boolean; role?: string; player?: string; error?: string }> {
  const { data: sess } = await supabase.auth.getSession();
  const bearer = sess.session?.access_token;
  const res = await fetch("/api/tour/accept-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify({ invite: token }),
  });
  return res.json();
}

/** Lädt die eingeplanten Turnier-IDs (Saisonplan) des Users. */
export async function loadTourPlan(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("tour_plan")
    .select("tournament_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.tournament_id as string);
}

/** Ersetzt den Saisonplan des Users komplett durch die übergebene ID-Liste. */
export async function saveTourPlan(userId: string, tournamentIds: string[]): Promise<void> {
  // Diff gegen den aktuellen Stand → nur nötige Inserts/Deletes.
  const current = new Set(await loadTourPlan(userId));
  const next = new Set(tournamentIds);
  const toAdd = tournamentIds.filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !next.has(id));
  if (toAdd.length) {
    await supabase
      .from("tour_plan")
      .upsert(toAdd.map((tournament_id) => ({ user_id: userId, tournament_id })), {
        onConflict: "user_id,tournament_id",
      });
  }
  if (toRemove.length) {
    await supabase.from("tour_plan").delete().eq("user_id", userId).in("tournament_id", toRemove);
  }
}
