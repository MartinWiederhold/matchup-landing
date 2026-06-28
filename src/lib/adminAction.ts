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
