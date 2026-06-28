import { createClient } from "@supabase/supabase-js";

/**
 * Server-seitiger Supabase-Client mit service_role-Key (umgeht RLS) auf dem
 * isolierten "web"-Schema. NUR in API-Routen verwenden — der Key ist server-only
 * (SUPABASE_SERVICE_ROLE_KEY, niemals NEXT_PUBLIC_).
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Service-Client nicht konfiguriert");
  return createClient(url, key, {
    db: { schema: "web" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function adminEmails(): string[] {
  const fromEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // eingebauter Fallback
  return Array.from(new Set([...fromEnv, "wiederhold.martin@web.de"]));
}

/**
 * Prüft das mitgesendete Bearer-Token (User-Session) und gibt den User zurück,
 * wenn er eingeloggt UND in der Admin-Allowlist ist — sonst null.
 */
export async function verifyAdmin(
  token: string | undefined,
): Promise<{ id: string; email: string } | null> {
  if (!token) return null;
  const svc = getServiceClient();
  const { data, error } = await svc.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  const email = data.user.email.toLowerCase();
  if (!adminEmails().includes(email)) return null;
  return { id: data.user.id, email };
}

export function bearerToken(req: Request): string | undefined {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : undefined;
}
