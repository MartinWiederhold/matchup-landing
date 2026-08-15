import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";
import { reminderSigValid } from "@/lib/reminderToken";

export const dynamic = "force-dynamic";

/**
 * Ein-Klick-Abmeldung aus jeder Erinnerungs-Mail (ohne Login). Verifiziert den HMAC-Token
 * und setzt die Einstellung auf AUS. WICHTIG: Dieser Endpoint schaltet NUR ab — nie ein
 * (fest enabled=false). Ein erratener Token kann damit keine fremden Erinnerungen
 * aktivieren; Wiedereinschalten geht nur im eingeloggten App-Schalter (RLS).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  if (!u || !sig || !reminderSigValid(u, sig)) {
    return new NextResponse(page(false), { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  const svc = getServiceClient();
  // NUR abschalten. Neuer Eintrag bekommt den Locale-Default; bestehender wird auf false gesetzt.
  await svc.from("tour_reminder_settings").upsert({ user_id: u, enabled: false }, { onConflict: "user_id" });
  return new NextResponse(page(true), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function page(ok: boolean): string {
  const heading = ok ? "Erinnerungen abbestellt" : "Link ungültig";
  const body = ok
    ? "Du bekommst keine Fristen-Erinnerungen mehr. · You will no longer receive deadline reminders.<br><br>Wieder einschalten kannst du sie jederzeit in der App unter <b>/tour</b>. · You can turn them back on anytime in the app under <b>/tour</b>."
    : "Dieser Abmelde-Link ist ungültig oder abgelaufen. · This unsubscribe link is invalid or has expired.";
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;background:#08080a;color:#e8e8ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:64px 24px;">
<div style="font-size:20px;font-weight:800;letter-spacing:6px;color:#fff;margin-bottom:28px;">MATCHUP</div>
<h1 style="font-size:22px;font-weight:800;margin:0 0 14px;">${heading}</h1>
<p style="font-size:15px;line-height:1.6;color:#b8b8c0;margin:0;">${body}</p>
<p style="margin-top:28px;"><a href="https://matchup-app.com/tour" style="color:#4b3bf3;text-decoration:none;font-weight:700;">→ matchup-app.com/tour</a></p>
</div></body></html>`;
}
