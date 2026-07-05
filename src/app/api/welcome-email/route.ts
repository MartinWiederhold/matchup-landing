import { NextResponse } from "next/server";

/**
 * Sendet die Willkommens-Mail (Matchup-Design) nach der Registrierung.
 * Sicherheit: Es wird der Supabase-Access-Token des Aufrufers verifiziert und
 * die Mail NUR an dessen eigene, in Supabase hinterlegte Adresse geschickt —
 * so kann die Route nicht zum Spam-Versand an Fremde missbraucht werden.
 */

function welcomeHtml(firstName?: string): string {
  const hi = firstName ? `Hey ${firstName},` : "Hey,";
  const tip = (t: string) =>
    `<tr><td style="padding:6px 0;font-size:15px;line-height:1.5;color:#c8c8d0;">• ${t}</td></tr>`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#08080a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#08080a;padding:40px 20px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding-bottom:28px;"><span style="font-size:20px;font-weight:800;letter-spacing:6px;color:#ffffff;">MATCHUP</span></td></tr>
<tr><td style="padding-bottom:28px;"><div style="height:1px;background-color:#26262e;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
<tr><td style="padding-bottom:12px;"><h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">Willkommen bei Matchup! 🎾</h1></td></tr>
<tr><td style="padding-bottom:20px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#b8b8c0;">${hi} schön, dass du dabei bist. Matchup verbindet dich mit Spielern für Tennis, Padel &amp; Pickleball – finde Partner auf deinem Level, organisiere Spiele und tracke deinen Fortschritt.</p></td></tr>
<tr><td style="padding-bottom:20px;"><table width="100%" cellpadding="0" cellspacing="0">
${tip("Entdecke Spieler in deiner Nähe und verbinde dich")}
${tip("Organisiere Spiele und lade Mitspieler ein")}
${tip("Trag Ergebnisse ein und verfolge deinen MatchScore")}
</table></td></tr>
<tr><td style="padding-bottom:28px;"><a href="https://matchup-app.com/app" style="display:inline-block;background-color:#4b3bf3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;">Jetzt loslegen</a></td></tr>
<tr><td style="padding-bottom:20px;"><div style="height:1px;background-color:#26262e;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
<tr><td><p style="margin:0;font-size:12px;color:#55555f;">Matchup · Spielpartner für Tennis, Padel &amp; Pickleball</p>
<p style="margin:4px 0 0;font-size:12px;"><a href="https://matchup-app.com" style="color:#4b3bf3;text-decoration:none;">matchup-app.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(request: Request) {
  const key = process.env.SENDGRID_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !url || !anon) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });

  // Token verifizieren → eigene E-Mail holen
  const uRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  if (!uRes.ok) return NextResponse.json({ error: "invalid token" }, { status: 401 });
  const user = (await uRes.json()) as { email?: string };
  if (!user.email) return NextResponse.json({ error: "no email" }, { status: 400 });

  let firstName: string | undefined;
  try {
    firstName = (await request.json())?.firstName;
  } catch {
    /* ignore */
  }

  const sg = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: user.email }] }],
      from: { email: "noreply@matchup-app.com", name: "Matchup" },
      subject: "Willkommen bei Matchup 🎾",
      content: [{ type: "text/html", value: welcomeHtml(firstName) }],
    }),
  });

  return NextResponse.json({ ok: sg.ok }, { status: 200 });
}
