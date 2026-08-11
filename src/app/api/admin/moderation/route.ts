import { NextResponse } from "next/server";
import { getServiceClient, verifyAdmin, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Moderationsdaten (report_count, banned_at, pause_reason) für die Admin-Oberfläche.
 * Diese Felder liegen in web.profiles_moderation (SERVICE-ONLY) bzw. profiles_private
 * (owner) und sind NICHT per Anon-Client lesbar (Sicherheitsaudit 2026-08). Zugriff
 * nur mit gültigem Admin-Bearer-Token; die Abfrage läuft server-seitig mit service_role.
 *
 *   GET /api/admin/moderation?ids=<uuid>,<uuid>  →  { rows: [{ user_id, report_count, banned_at, pause_reason }] }
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(bearerToken(req));
  if (!admin) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });

  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ rows: [] });

  const svc = getServiceClient();
  const [{ data: mod }, { data: priv }] = await Promise.all([
    svc.from("profiles_moderation").select("user_id, report_count, banned_at").in("user_id", ids),
    svc.from("profiles_private").select("user_id, pause_reason").in("user_id", ids),
  ]);
  const pauseById = new Map(((priv as { user_id: string; pause_reason: string | null }[]) ?? []).map((r) => [r.user_id, r.pause_reason]));
  const rows = ((mod as { user_id: string; report_count: number; banned_at: string | null }[]) ?? []).map((m) => ({
    user_id: m.user_id,
    report_count: m.report_count,
    banned_at: m.banned_at,
    pause_reason: pauseById.get(m.user_id) ?? null,
  }));
  return NextResponse.json({ rows });
}
