"use client";

import { useT, useLocale } from "@/lib/i18n";
import { tourDeadlines } from "@/domain/tour/deadlines";
import type { TourTournament } from "@/lib/types";

// Fristen sind echte Zeitpunkte (14:00 GMT) → in der LOKALEN Zeitzone anzeigen,
// inklusive Zeitzonen-Kürzel, damit klar ist, worauf sich die Angabe bezieht.
function fmtDeadline(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

/** Eine Fristzeile: Label + Zeitpunkt (lokal), abgelaufene dezent markiert. */
function DeadlineRow({ label, date, suffix }: { label: string; date: Date; suffix?: string }) {
  const { locale } = useLocale();
  const t = useT();
  const expired = date.getTime() < Date.now();
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-[13px]">
      <span className="text-neutral-500">
        {label}
        {suffix && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{suffix}</span>}
      </span>
      <span className={expired ? "text-neutral-400 line-through" : "font-medium text-neutral-800"}>
        {fmtDeadline(date, locale)}
        {expired && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-neutral-400 no-underline">({t("tour.expired")})</span>}
      </span>
    </div>
  );
}

/**
 * Fristenblock eines Turniers — geteilt zwischen Turnierkalender (/tour) und
 * Saison (/tour/season), damit beide Ansichten identisch bleiben (eine Wahrheit).
 * ITF: Entry/Withdrawal/Freeze (nur Variante A, sichtbar als ungeprüft markiert).
 * Challenger: Regel unbekannt — ehrlich anzeigen, nicht kaschieren.
 */
export default function TourDeadlineBlock({ tournament: x }: { tournament: TourTournament }) {
  const t = useT();
  // Turniermontag als UTC-Mitternacht in die reine Domain-Funktion.
  const monday = new Date(x.tournament_monday + "T00:00:00Z");
  const dl = tourDeadlines(monday, x.series, x.category);

  // Bekannte Serie mit mindestens einer belegten Frist. Bei Junioren J500/Grand Slam fehlt der
  // Entry (turnierspezifisch) — Withdrawal/Freeze sind aber bekannt und werden trotzdem gezeigt.
  const hasAny = dl.known && (dl.entry || dl.withdrawal || dl.freezeVarianteA);
  // „Ungeprüft" nur bei der mehrdeutigen WTT-Freeze (zwei Lesarten). Die Junioren-Freeze ist
  // eindeutig (§39 vi) → freezeVarianteB === null → kein Hinweis.
  const freezeUnverified = dl.freezeVarianteB != null;

  return (
    <div className="mt-4 border-t border-black/[0.06] pt-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.deadlinesTitle")}</p>
      {hasAny ? (
        <div className="mt-1">
          {dl.entry && <DeadlineRow label={t("tour.entry")} date={dl.entry} />}
          {dl.withdrawal && <DeadlineRow label={t("tour.withdrawal")} date={dl.withdrawal} />}
          {dl.freezeVarianteA && <DeadlineRow label={t("tour.freeze")} date={dl.freezeVarianteA} suffix={freezeUnverified ? t("tour.freezeUnverified") : undefined} />}
          <p className="mt-2 text-[11px] text-neutral-400">{t("tour.tzHint")}</p>
        </div>
      ) : (
        <div className="mt-1 rounded-lg bg-black/[0.035] px-3 py-2.5">
          <p className="text-[13px] font-semibold text-neutral-700">{t("tour.challengerUnknownTitle")}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{t("tour.challengerUnknownText")}</p>
        </div>
      )}
    </div>
  );
}
