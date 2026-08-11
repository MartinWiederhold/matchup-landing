import { supabase } from "./supabase";

/**
 * Ruft eine gesicherte Admin-Aktion serverseitig auf. Hängt das Access-Token
 * der aktuellen Session als Bearer mit; der Server prüft Admin-Rechte und führt
 * die Mutation mit service_role aus.
 */
export async function adminAction(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Nicht eingeloggt");

  const res = await fetch("/api/admin/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
}

export type ModerationRow = {
  user_id: string;
  report_count: number;
  banned_at: string | null;
  pause_reason: string | null;
};

/**
 * Moderationsdaten (report_count/banned_at/pause_reason) für die Admin-Oberfläche.
 * Diese Felder liegen server-only (web.profiles_moderation / profiles_private) und sind
 * NICHT per Anon-Client lesbar (Sicherheitsaudit 2026-08) — daher über die verifyAdmin-
 * Route mit Bearer-Token. Gibt eine Map user_id → Zeile zurück.
 */
export async function fetchModeration(ids: string[]): Promise<Map<string, ModerationRow>> {
  const m = new Map<string, ModerationRow>();
  if (ids.length === 0) return m;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return m;
  const res = await fetch(`/api/admin/moderation?ids=${encodeURIComponent(ids.join(","))}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return m;
  const json = (await res.json().catch(() => ({ rows: [] }))) as { rows?: ModerationRow[] };
  for (const r of json.rows ?? []) m.set(r.user_id, r);
  return m;
}
