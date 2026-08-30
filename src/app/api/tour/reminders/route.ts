import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminClient";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { dueReminders, REMINDER_BASE, type ReminderKind } from "@/domain/tour/reminders";
import { buildReminderEmail, type EmailLocale } from "@/lib/reminderEmail";
import { reminderSig } from "@/lib/reminderToken";
import type { TourEntryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Fristen-Erinnerungen — stündlicher Cron. Prüft die ITF-Meldefristen der Turniere in den
 * Saisonplänen und schickt vier Erinnerungen (Meldeschluss −72h/−24h, Rückzug −48h/−12h).
 * Challenger-Fristen sind unbekannt → nichts. Die Entscheidung trägt die reine Funktion
 * dueReminders (per Vitest belegt); diese Route ist die Verkabelung (DB → Mail → Log).
 *
 * Schutz wie /api/news/sync (CRON_SECRET). Zwei Test-Schalter, NUR mit Secret erreichbar:
 *   ?dryRun=1     → rechnet, sendet/loggt NICHT, gibt die „würde-senden"-Liste zurück
 *   ?now=<ISO>    → simulierter Bezugszeitpunkt (Beleg gegen echte Turnierdaten)
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

type PlanRow = { user_id: string; tournament_id: string; status: TourEntryStatus };
type TourRow = { id: string; tournament_monday: string; series: "itf_wtt" | "challenger" | "itf_juniors"; category: string | null; name: string | null; city: string | null; country: string | null };

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const nowParam = url.searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : new Date();
  if (Number.isNaN(now.getTime())) return NextResponse.json({ error: "bad now" }, { status: 400 });

  const svc = getServiceClient();
  const [{ data: plans }, { data: settings }, { data: logs }] = await Promise.all([
    svc.from("tour_season_plan").select("user_id, tournament_id, status"),
    svc.from("tour_reminder_settings").select("user_id, enabled, locale"),
    svc.from("tour_reminder_log").select("user_id, tournament_id, kind"),
  ]);
  const planRows = (plans as PlanRow[]) ?? [];
  if (planRows.length === 0) return NextResponse.json({ now: now.toISOString(), dryRun, candidates: 0, sent: 0 });

  const tourIds = [...new Set(planRows.map((p) => p.tournament_id))];
  const { data: tours } = await svc.from("tour_tournaments").select("id, tournament_monday, series, category, name, city, country").in("id", tourIds).is("valid_to", null);
  const tourById = new Map(((tours as TourRow[]) ?? []).map((t) => [t.id, t]));

  const settingsByUser = new Map(((settings as { user_id: string; enabled: boolean; locale: string }[]) ?? []).map((s) => [s.user_id, s]));
  // Bereits verschickt: user|tournament → Menge der kinds.
  const sentByUserTour = new Map<string, Set<string>>();
  for (const l of (logs as { user_id: string; tournament_id: string; kind: string }[]) ?? []) {
    const k = `${l.user_id}|${l.tournament_id}`;
    const set = sentByUserTour.get(k) ?? new Set<string>();
    set.add(l.kind);
    sentByUserTour.set(k, set);
  }

  type Cand = { userId: string; tour: TourRow; kind: ReminderKind };
  const cands: Cand[] = [];
  for (const p of planRows) {
    if (settingsByUser.get(p.user_id)?.enabled !== true) continue; // Opt-in: nur senden, wenn der Nutzer die Fristen-Erinnerungen ausdrücklich aktiviert hat (fehlende Zeile = aus)
    const t = tourById.get(p.tournament_id);
    if (!t) continue;
    const dl = tourDeadlines(new Date(t.tournament_monday + "T00:00:00Z"), t.series, t.category);
    const alreadySent = sentByUserTour.get(`${p.user_id}|${p.tournament_id}`) ?? new Set<string>();
    for (const kind of dueReminders({ known: dl.known, entry: dl.entry, withdrawal: dl.withdrawal, status: p.status, now, alreadySent })) {
      cands.push({ userId: p.user_id, tour: t, kind });
    }
  }

  if (dryRun) {
    return NextResponse.json({
      now: now.toISOString(), dryRun: true, sent: 0, candidates: cands.length,
      would_send: cands.map((c) => ({ userId: c.userId, tournamentId: c.tour.id, city: c.tour.city, kind: c.kind })),
    });
  }

  // Versand: E-Mail je Nutzer einmal holen, senden, Dedup-Log NACH Erfolg schreiben.
  const emailByUser = new Map<string, string | null>();
  const getEmail = async (uid: string): Promise<string | null> => {
    if (emailByUser.has(uid)) return emailByUser.get(uid) ?? null;
    const { data } = await svc.auth.admin.getUserById(uid);
    const email = data?.user?.email ?? null;
    emailByUser.set(uid, email);
    return email;
  };
  const sgKey = process.env.SENDGRID_API_KEY;
  let sent = 0;
  for (const c of cands) {
    const email = await getEmail(c.userId);
    if (!email) continue;
    const locale = (settingsByUser.get(c.userId)?.locale as EmailLocale) ?? "de";
    const dl = tourDeadlines(new Date(c.tour.tournament_monday + "T00:00:00Z"), c.tour.series, c.tour.category);
    const deadline = REMINDER_BASE[c.kind] === "entry" ? dl.entry : dl.withdrawal;
    if (!deadline) continue;
    const sig = reminderSig(c.userId);
    const unsubscribeUrl = sig ? `https://matchup-app.com/api/tour/reminders/unsubscribe?u=${c.userId}&sig=${sig}` : "https://matchup-app.com/tour";
    const { subject, html } = buildReminderEmail(locale, { kind: c.kind, tournamentName: c.tour.name, city: c.tour.city, country: c.tour.country, deadline, now, unsubscribeUrl });

    if (sgKey) {
      const sg = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${sgKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: "noreply@matchup-app.com", name: "Matchup" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
      if (!sg.ok) continue; // nicht loggen, wenn nicht verschickt → nächster Lauf versucht erneut
    }
    // Dedup-Log (Unique-Konflikt ignorieren, falls ein Parallel-Lauf zuvorkam).
    await svc.from("tour_reminder_log").insert({ user_id: c.userId, tournament_id: c.tour.id, kind: c.kind });
    sent++;
  }
  return NextResponse.json({ now: now.toISOString(), dryRun: false, candidates: cands.length, sent });
}
