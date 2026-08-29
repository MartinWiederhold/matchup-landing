import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";

/**
 * Schickt dem Angefragten EINE E-Mail, sobald sich jemand mit ihm verbinden will
 * ("Verbinden" → Zeile in web.likes).
 *
 * Sicherheit / Anti-Spam:
 *  - Der Absender wird über sein eigenes Supabase-Access-Token verifiziert.
 *  - Es wird NUR gesendet, wenn wirklich ein Like Absender→Ziel existiert
 *    (serverseitig geprüft) — man kann also niemanden anmailen, den man nicht
 *    tatsächlich angefragt hat.
 *  - Ratenbegrenzung über likes.notified_at: pro Anfrage höchstens eine Mail.
 *  - Opt-out über profiles.email_on_request (Default an) wird respektiert.
 *  Der service_role-Key bleibt server-only (adminClient).
 */

function connectHtml(senderName: string, firstName?: string | null): string {
  const hi = firstName ? `Hey ${firstName},` : "Hey,";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#08080a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#08080a;padding:40px 20px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding-bottom:28px;"><span style="font-size:20px;font-weight:800;letter-spacing:6px;color:#ffffff;">MATCHUP</span></td></tr>
<tr><td style="padding-bottom:28px;"><div style="height:1px;background-color:#26262e;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
<tr><td style="padding-bottom:12px;"><h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">Neue Verbindungsanfrage 🎾</h1></td></tr>
<tr><td style="padding-bottom:20px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#b8b8c0;">${hi} <strong style="color:#ffffff;">${senderName}</strong> möchte sich auf Matchup mit dir verbinden. Schau vorbei und antworte, wenn du Lust auf ein Spiel hast.</p></td></tr>
<tr><td style="padding-bottom:28px;"><a href="https://matchup-app.com/app" style="display:inline-block;background-color:#4b3bf3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;">Anfrage ansehen</a></td></tr>
<tr><td style="padding-bottom:20px;"><div style="height:1px;background-color:#26262e;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
<tr><td><p style="margin:0;font-size:12px;color:#55555f;">Diese Benachrichtigung kannst du jederzeit im Profil → Einstellungen abstellen.</p>
<p style="margin:4px 0 0;font-size:12px;"><a href="https://matchup-app.com" style="color:#4b3bf3;text-decoration:none;">matchup-app.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sgKey = process.env.SENDGRID_API_KEY;
  if (!url || !anon) return NextResponse.json({ skipped: true }, { status: 200 });

  // 1) Absender über sein eigenes Token verifizieren.
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });
  const uRes = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!uRes.ok) return NextResponse.json({ error: "invalid token" }, { status: 401 });
  const fromUserId = ((await uRes.json()) as { id?: string }).id;
  if (!fromUserId) return NextResponse.json({ error: "no user" }, { status: 401 });

  // 2) Ziel aus dem Body.
  let toUserId: string | undefined;
  try { toUserId = (await request.json())?.toUserId; } catch { /* ignore */ }
  if (!toUserId || toUserId === fromUserId) return NextResponse.json({ skipped: true }, { status: 200 });

  const svc = getServiceClient();

  // 3) Es muss ein noch nicht benachrichtigter Like Absender→Ziel existieren.
  const { data: like } = await svc
    .from("likes")
    .select("id, notified_at")
    .eq("from_user_id", fromUserId)
    .eq("to_user_id", toUserId)
    .maybeSingle();
  if (!like || like.notified_at) return NextResponse.json({ skipped: true }, { status: 200 });

  // notified_at sofort setzen (verhindert Doppelversand bei parallelen Aufrufen).
  await svc.from("likes").update({ notified_at: new Date().toISOString() }).eq("id", like.id).is("notified_at", null);

  // 4) Ziel-Präferenz respektieren.
  const { data: target } = await svc
    .from("profiles")
    .select("first_name, email_on_request")
    .eq("id", toUserId)
    .maybeSingle();
  if (!target || target.email_on_request === false) {
    return NextResponse.json({ skipped: true, reason: "opted-out" }, { status: 200 });
  }

  // 5) Absender-Name + Ziel-E-Mail (E-Mail liegt in auth.users → service_role).
  const { data: fromProf } = await svc.from("profiles").select("first_name, display_name").eq("id", fromUserId).maybeSingle();
  const senderName = (fromProf?.display_name || fromProf?.first_name || "Jemand").toString().trim() || "Jemand";
  const { data: au } = await svc.auth.admin.getUserById(toUserId);
  const email = au?.user?.email;
  if (!email) return NextResponse.json({ skipped: true }, { status: 200 });

  // 6) Senden (nur wenn SendGrid konfiguriert ist).
  if (sgKey) {
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sgKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: "noreply@matchup-app.com", name: "Matchup" },
        subject: `${senderName} möchte sich mit dir verbinden 🎾`,
        content: [{ type: "text/html", value: connectHtml(senderName, target.first_name) }],
      }),
    });
  }
  return NextResponse.json({ sent: true });
}
