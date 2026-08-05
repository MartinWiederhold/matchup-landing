"use client";

import Link from "next/link";
import { useT, useLocale } from "@/lib/i18n";
import { tourDeadlines } from "@/domain/tour/deadlines";
import type { SeasonEntry } from "@/lib/tourSeason";

const DAY = 86_400_000;

// Fristzeitpunkt (14:00 GMT) in lokaler Zeitzone anzeigen, inkl. Zonen-Kürzel.
function fmtDeadline(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(d);
}

/**
 * Die WICHTIGSTE Zeile der Arbeitsfläche: die nächste noch offene Meldefrist über
 * alle Saisonturniere. Fristen verfallen und sind nicht nachholbar — deshalb ganz oben.
 * Nur ITF liefert bekannte Fristen; Challenger ist unbekannt (Domain) und trägt nichts bei.
 */
export default function NextDeadline({ entries }: { entries: SeasonEntry[] }) {
  const t = useT();
  const { locale } = useLocale();
  const now = Date.now();

  // Alle offenen Fristen (Entry + Withdrawal) in der Zukunft sammeln, früheste zuerst.
  const cands: { entry: SeasonEntry; label: string; date: Date }[] = [];
  for (const e of entries) {
    const monday = new Date(e.tournament.tournament_monday + "T00:00:00Z");
    const dl = tourDeadlines(monday, e.tournament.series);
    if (dl.entry && dl.entry.getTime() > now) cands.push({ entry: e, label: t("tour.entry"), date: dl.entry });
    if (dl.withdrawal && dl.withdrawal.getTime() > now) cands.push({ entry: e, label: t("tour.withdrawal"), date: dl.withdrawal });
  }
  cands.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = cands[0];

  if (!next) {
    return (
      <section className="rounded-2xl bg-black/[0.02] ring-1 ring-black/5 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsNextDeadlineTitle")}</p>
        <p className="mt-1 text-sm text-neutral-500">{t("tour.wsNextDeadlineNone")}</p>
      </section>
    );
  }

  const x = next.entry.tournament;
  const days = Math.ceil((next.date.getTime() - now) / DAY);
  const place = `${x.city || t("tour.fieldMissing")}${x.country ? ", " + x.country : ""}`;
  // Wenige Tage → drängendere Färbung (Bernstein), aber kein Alarmrot, kein Blinken.
  const urgent = days <= 7;

  return (
    <section className={`rounded-3xl px-5 py-5 text-white shadow-sm sm:px-7 sm:py-6 ${urgent ? "bg-amber-500" : "bg-matchup"}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">{t("tour.wsNextDeadlineTitle")}</p>
      <p className="mt-2 text-4xl font-black leading-none tracking-tight sm:text-5xl">{t("tour.wsDeadlineIn", { n: days })}</p>
      <p className="mt-4 text-[16px] font-bold tracking-tight">
        {place} <span className="font-semibold text-white/70">· {next.label}</span>
      </p>
      <p className="mt-0.5 text-[13px] text-white/70">{fmtDeadline(next.date, locale)}</p>
      <Link href="/tour/season" className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/25">
        {t("tour.wsDeadlineGo")} →
      </Link>
    </section>
  );
}
