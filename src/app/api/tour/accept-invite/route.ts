import { NextResponse } from "next/server";
import { getServiceClient, bearerToken } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Team-Einladung annehmen: der eingeloggte Nutzer wird als Mitglied (Coach/Physio/…)
 * mit dem Spieler verknüpft. Service-Client, damit das Verknüpfen (fremde Zeile)
 * kontrolliert passiert; nur der Token-Inhaber kann annehmen.
 */
export async function POST(req: Request) {
  const token = bearerToken(req);
  const svc = getServiceClient();
  const { data: userData } = token ? await svc.auth.getUser(token) : { data: { user: null } };
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { invite?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const invite = (body.invite ?? "").trim();
  if (!invite) return NextResponse.json({ error: "no_invite" }, { status: 400 });

  const { data: row } = await svc
    .from("tour_team")
    .select("id, player_id, role, member_user_id")
    .eq("invite_token", invite)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.player_id === user.id) return NextResponse.json({ error: "own_invite" }, { status: 400 });
  if (row.member_user_id && row.member_user_id !== user.id) {
    return NextResponse.json({ error: "already_taken" }, { status: 409 });
  }

  const { data: me } = await svc.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
  const { data: player } = await svc.from("profiles").select("first_name").eq("id", row.player_id).maybeSingle();

  await svc
    .from("tour_team")
    .update({ member_user_id: user.id, status: "active", member_name: me?.first_name ?? null })
    .eq("id", row.id);

  return NextResponse.json({ ok: true, role: row.role, player: player?.first_name ?? null });
}
