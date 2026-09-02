import { NextResponse } from "next/server";
import { getServiceClient, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Hebt eine Foto-Moderations-Pause (pause_requires_photo) auf — aber NUR, wenn der
 * Nutzer inzwischen wirklich ein Profilbild hat. Das Flag ist per Guard-Trigger für
 * den Nutzer gesperrt, daher läuft die Freischaltung serverseitig (Service-Role) nach
 * Prüfung des eigenen Tokens. Kein Umgehen der Auflage möglich.
 */
export async function POST(req: Request) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getServiceClient();
  const { data: auth, error: authErr } = await svc.auth.getUser(token);
  if (authErr || !auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const uid = auth.user.id;

  const { data: prof } = await svc
    .from("profiles")
    .select("profile_image")
    .eq("id", uid)
    .maybeSingle();
  if (!prof?.profile_image) {
    return NextResponse.json({ error: "no_photo" }, { status: 400 });
  }

  const { error } = await svc
    .from("profiles")
    .update({ is_paused: false, pause_requires_photo: false })
    .eq("id", uid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await svc.from("profiles_private").update({ pause_reason: null }).eq("user_id", uid);

  return NextResponse.json({ ok: true });
}
