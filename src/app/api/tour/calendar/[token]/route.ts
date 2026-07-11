import { getServiceClient } from "@/lib/adminClient";

export const dynamic = "force-dynamic";

/**
 * Öffentlicher iCal-Feed der Tour-Termine eines Nutzers — zum Abonnieren in
 * Google/Apple/Outlook. Auth erfolgt über den geheimen Token in der URL
 * (Kalender-Apps können keinen Bearer senden). Read-only, nur zukünftige +
 * jüngste Termine.
 */
function esc(s: string): string {
  return (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
/** ISO-Datum (+ optionale Zeit) → iCal-Wert (floating, ohne TZ). */
function icalDate(date: string, time: string | null): { key: string; val: string } {
  const [y, m, d] = date.split("-");
  if (!time) return { key: "DTSTART;VALUE=DATE", val: `${y}${m}${d}` };
  const [hh, mm] = time.split(":");
  return { key: "DTSTART", val: `${y}${m}${d}T${pad(Number(hh))}${pad(Number(mm))}00` };
}

const KIND_LABEL: Record<string, string> = {
  training: "Training", match: "Match", physio: "Physio", travel: "Reise", gym: "Gym", other: "Termin",
};

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: raw } = await ctx.params;
  const token = raw.replace(/\.ics$/i, "");
  const svc = getServiceClient();

  const { data: cal } = await svc.from("tour_calendar").select("user_id").eq("token", token).maybeSingle();
  if (!cal) return new Response("Not found", { status: 404 });

  const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const { data: events } = await svc
    .from("tour_events")
    .select("id,kind,title,event_date,event_time,note")
    .eq("user_id", cal.user_id)
    .gte("event_date", since)
    .order("event_date");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Matchup//Tour//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Matchup Tour",
    "X-PUBLISHED-TTL:PT6H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
  ];
  for (const e of (events as { id: string; kind: string; title: string; event_date: string; event_time: string | null; note: string | null }[]) ?? []) {
    const dt = icalDate(e.event_date, e.event_time);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@matchup-app.com`,
      `${dt.key}:${dt.val}`,
      `SUMMARY:${esc(e.title)}`,
      `CATEGORIES:${esc(KIND_LABEL[e.kind] ?? "Termin")}`,
    );
    if (e.note) lines.push(`DESCRIPTION:${esc(e.note)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="matchup-tour.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
