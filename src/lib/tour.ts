import { supabase } from "@/lib/supabase";
import type { TourProfile } from "@/lib/types";

/** Tour ist vorerst gesperrt (Early Access). Freischalt-Code für interne Tests. */
export const TOUR_CODE = "5080";
export function tourUnlocked(): boolean {
  try {
    return localStorage.getItem("mu_tour_unlocked") === "1";
  } catch {
    return false;
  }
}
export function unlockTour(): void {
  try {
    localStorage.setItem("mu_tour_unlocked", "1");
  } catch {
    /* ignore */
  }
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

/* ── Team-Einladungen ─────────────────────────────────────── */
export type TeamInvite = { id: string; role: string; member_name: string | null; status: string; invite_token: string };

export async function loadTeam(playerId: string): Promise<TeamInvite[]> {
  const { data } = await supabase
    .from("tour_team")
    .select("id,role,member_name,status,invite_token")
    .eq("player_id", playerId);
  return (data as TeamInvite[]) ?? [];
}

/** Erzeugt (oder liefert) einen Einladungs-Token für eine Rolle. */
export async function ensureInvite(playerId: string, role: string): Promise<string> {
  const { data } = await supabase
    .from("tour_team")
    .select("invite_token")
    .eq("player_id", playerId)
    .eq("role", role)
    .limit(1);
  const existing = data?.[0]?.invite_token as string | undefined;
  if (existing) return existing;
  const token = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.round(Math.random() * 1e9)}`).replace(/-/g, "");
  await supabase.from("tour_team").insert({ player_id: playerId, role, invite_token: token });
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
