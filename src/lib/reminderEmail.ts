/**
 * E-Mail-Vorlagen für Fristen-Erinnerungen (Tour). Serverseitig, daher NICHT über das
 * App-i18n (das ist client-seitig) — die Mailtexte stehen hier zweisprachig (DE/EN) direkt.
 * Design wie die Willkommensmail (dunkel, Matchup). KEINE neue Dependency.
 *
 * Kernentscheidung (Vorgabe): Die verbleibende ZEIT steht prominent („in 3 Tagen") — das
 * ist die Angabe, die zählt. Das exakte Datum in UTC ist nur die Absicherung: ein Spieler
 * in Tunesien rechnet nicht in UTC.
 */
import type { ReminderKind } from "@/domain/tour/reminders";
import { REMINDER_BASE } from "@/domain/tour/reminders";

const HOUR = 3_600_000;
const DAY = 86_400_000;

export type EmailLocale = "de" | "en";

// ITF-Meldeportal (nur ITF bekommt Erinnerungen; Challenger-Fristen sind unbekannt).
const ITF_PORTAL = "https://tourzone.world.tennis";
const APP_URL = "https://matchup-app.com/tour";

const COPY: Record<EmailLocale, {
  entryTitle: string; withdrawalTitle: string;
  remainingLead: string; exactLead: string; portal: string; cta: string;
  why: string; unsub: string; footer: string;
  days: (n: number) => string; hours: (n: number) => string;
  subjectEntry: (rem: string, city: string) => string;
  subjectWithdrawal: (rem: string, city: string) => string;
}> = {
  de: {
    entryTitle: "Meldeschluss",
    withdrawalTitle: "Rückzugsfrist",
    remainingLead: "Verbleibende Zeit",
    exactLead: "Genau",
    portal: "Melden/zurückziehen im World-Tennis-Tour-Zone-Portal (ehemals IPIN).",
    cta: "In der App öffnen",
    why: "Du bekommst diese Erinnerung, weil dieses Turnier in deiner Matchup-Saison steht.",
    unsub: "Erinnerungen abbestellen",
    footer: "Matchup · Tour",
    days: (n) => `in ${n} ${n === 1 ? "Tag" : "Tagen"}`,
    hours: (n) => `in ${n} ${n === 1 ? "Stunde" : "Stunden"}`,
    subjectEntry: (rem, city) => `Meldeschluss ${rem} — ${city}`,
    subjectWithdrawal: (rem, city) => `Rückzugsfrist ${rem} — ${city}`,
  },
  en: {
    entryTitle: "Entry deadline",
    withdrawalTitle: "Withdrawal deadline",
    remainingLead: "Time remaining",
    exactLead: "Exactly",
    portal: "Enter/withdraw in the World Tennis Tour Zone portal (formerly IPIN).",
    cta: "Open in the app",
    why: "You're getting this because this tournament is in your Matchup season.",
    unsub: "Unsubscribe from reminders",
    footer: "Matchup · Tour",
    days: (n) => `in ${n} ${n === 1 ? "day" : "days"}`,
    hours: (n) => `in ${n} ${n === 1 ? "hour" : "hours"}`,
    subjectEntry: (rem, city) => `Entry deadline ${rem} — ${city}`,
    subjectWithdrawal: (rem, city) => `Withdrawal deadline ${rem} — ${city}`,
  },
};

/** Verbleibende Zeit als klarer Satz: ab ~2 Tagen in Tagen, sonst in Stunden (gerundet). */
function remainingLabel(ms: number, c: (typeof COPY)["de"]): string {
  if (ms >= 47 * HOUR) return c.days(Math.round(ms / DAY));
  return c.hours(Math.max(1, Math.round(ms / HOUR)));
}

export type ReminderEmailParams = {
  kind: ReminderKind;
  tournamentName: string | null;
  city: string | null;
  country: string | null;
  deadline: Date;   // UTC-Zeitpunkt der Frist
  now: Date;        // Bezugszeitpunkt (verbleibende Zeit = deadline − now)
  unsubscribeUrl: string;
};

export function buildReminderEmail(locale: EmailLocale, p: ReminderEmailParams): { subject: string; html: string } {
  const c = COPY[locale] ?? COPY.de;
  const isEntry = REMINDER_BASE[p.kind] === "entry";
  const title = isEntry ? c.entryTitle : c.withdrawalTitle;
  const place = [p.city, p.country].filter(Boolean).join(", ") || (p.tournamentName ?? "—");
  const cityShort = p.city || p.tournamentName || place;
  const rem = remainingLabel(p.deadline.getTime() - p.now.getTime(), c);
  const exact = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(p.deadline);

  const subject = isEntry ? c.subjectEntry(rem, cityShort) : c.subjectWithdrawal(rem, cityShort);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#08080a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#08080a;padding:40px 20px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding-bottom:24px;"><span style="font-size:20px;font-weight:800;letter-spacing:6px;color:#ffffff;">MATCHUP</span></td></tr>
<tr><td style="padding-bottom:20px;"><div style="height:1px;background-color:#26262e;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
<tr><td style="padding-bottom:6px;"><span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a96;">${title}</span></td></tr>
<tr><td style="padding-bottom:8px;"><h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;">${place}</h1></td></tr>
<!-- Verbleibende Zeit PROMINENT — die Angabe, die zählt. -->
<tr><td style="padding:14px 0 4px;"><span style="font-size:13px;color:#8a8a96;">${c.remainingLead}</span></td></tr>
<tr><td style="padding-bottom:14px;"><span style="font-size:30px;font-weight:800;color:#4b3bf3;">${rem}</span></td></tr>
<!-- Exaktes Datum in UTC nur als Absicherung. -->
<tr><td style="padding-bottom:20px;"><span style="font-size:13px;color:#b8b8c0;">${c.exactLead}: ${exact} UTC</span></td></tr>
<tr><td style="padding-bottom:22px;"><p style="margin:0;font-size:14px;line-height:1.55;color:#b8b8c0;"><a href="${ITF_PORTAL}" style="color:#b8b8c0;text-decoration:underline;">${c.portal}</a></p></td></tr>
<tr><td style="padding-bottom:26px;"><a href="${APP_URL}" style="display:inline-block;background-color:#4b3bf3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;">${c.cta}</a></td></tr>
<tr><td style="padding-bottom:16px;"><div style="height:1px;background-color:#26262e;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
<tr><td><p style="margin:0;font-size:12px;line-height:1.5;color:#55555f;">${c.why}</p>
<p style="margin:6px 0 0;font-size:12px;"><a href="${p.unsubscribeUrl}" style="color:#8a8a96;text-decoration:underline;">${c.unsub}</a></p>
<p style="margin:10px 0 0;font-size:12px;color:#55555f;">${c.footer} · <a href="https://matchup-app.com" style="color:#4b3bf3;text-decoration:none;">matchup-app.com</a></p></td></tr>
</table></td></tr></table></body></html>`;

  return { subject, html };
}
