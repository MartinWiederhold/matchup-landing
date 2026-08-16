import { supabase } from "@/lib/supabase";

/**
 * Turnier-Präsenz für /tour („Wer ist hier?"). Nutzt DIESELBE Tabelle wie /map
 * (web.player_presence, RLS: insert own, select für alle Eingeloggten), aber mit
 * tour_tournaments-IDs als tournament_id (Text-Spalte, kein FK → eigener ID-Namensraum,
 * koexistiert mit /map) und Feldern aus dem DB-Profil statt aus /map’s localStorage.
 * Bewusst eine EIGENE Datei — /map’s src/lib/player.ts bleibt unangetastet.
 *
 * Opt-in mit zwei Absichten: looking = sucht Trainingspartner, looking_room = sucht
 * Mitbewohner (Zimmer teilen). Der Kontakt wird vom Nutzer selbst gewählt/preisgegeben.
 */
export type TourPresence = {
  user_id: string;
  name: string | null;
  rank_label: string | null;
  nationality: string | null;
  looking: boolean;
  looking_room: boolean;
  contact: string | null;
  profile_image: string | null; // öffentliches Avatar aus web.profiles (per user_id verknüpft)
};

export type PresenceFields = { name: string | null; rankLabel: string | null; nationality: string | null };

export async function loadTourPresence(tournamentId: string): Promise<TourPresence[]> {
  const { data } = await supabase
    .from("player_presence")
    .select("user_id, name, rank_label, nationality, looking, looking_room, contact")
    .eq("tournament_id", tournamentId)
    .order("updated_at", { ascending: false });
  const rows = (data as Omit<TourPresence, "profile_image">[]) ?? [];
  if (rows.length === 0) return [];

  // Avatare aus profiles nachladen (profile_image ist eine öffentliche Storage-URL; die
  // Präsenz ist Opt-in, das Bild wird — wie in /app — zum selbst gewählten Auftritt gezeigt).
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("id, profile_image").in("id", ids);
  const avatarById = new Map(((profs as { id: string; profile_image: string | null }[]) ?? []).map((p) => [p.id, p.profile_image]));
  return rows.map((r) => ({ ...r, profile_image: avatarById.get(r.user_id) ?? null }));
}

export async function joinTourPresence(
  userId: string,
  tournamentId: string,
  f: PresenceFields,
  looking: boolean,
  lookingRoom: boolean,
  contact: string,
): Promise<boolean> {
  const { error } = await supabase.from("player_presence").upsert(
    {
      user_id: userId,
      tournament_id: tournamentId,
      name: f.name,
      rank_label: f.rankLabel,
      nationality: f.nationality,
      looking,
      looking_room: lookingRoom,
      contact: contact.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tournament_id" },
  );
  return !error;
}

export async function leaveTourPresence(userId: string, tournamentId: string): Promise<boolean> {
  const { error } = await supabase.from("player_presence").delete().eq("user_id", userId).eq("tournament_id", tournamentId);
  return !error;
}

/** Selbst gewählten Kontakt in einen Link verwandeln: E-Mail → mailto, @handle →
 *  Instagram, Nummer → WhatsApp, sonst kein Link (als Text zeigen). */
export function contactHref(contact: string): string | null {
  const s = contact.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return `mailto:${s}`;
  if (s.startsWith("@")) return `https://instagram.com/${s.slice(1)}`;
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length >= 8 && /^[+\d][\d\s()/-]+$/.test(s)) return `https://wa.me/${digits}`;
  return null;
}
