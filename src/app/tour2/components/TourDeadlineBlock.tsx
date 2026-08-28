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
    <div className="flex items-baseline justify-between gap-3 py-1 t2-fs-body-sm">
      <span className="text-[var(--t2-muted)]">
        {label}
        {suffix && <span className="ml-1.5 rounded bg-[var(--t2-warn-surface)] px-1.5 py-0.5 t2-fs-meta font-semibold text-[var(--t2-warn)]">{suffix}</span>}
      </span>
      <span className={expired ? "text-[var(--t2-faint)] line-through" : "font-medium text-[var(--t2-ink)]"}>
        {fmtDeadline(date, locale)}
        {expired && <span className="ml-1.5 t2-fs-meta uppercase tracking-wide text-[var(--t2-faint)] no-underline">({t("tour.expired")})</span>}
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
    <div className="mt-4 border-t border-[var(--t2-line)] pt-3">
      <p className="t2-kicker">{t("tour.deadlinesTitle")}</p>
      {/* Junioren: Meldung erst ab 13 (§4). Ohne Geburtsdatum nicht prüfbar — aber benannt,
          nicht verschwiegen, weil das Turnier öffentlich sichtbar ist. */}
      {x.series === "itf_juniors" && (
        <p className="mt-1 rounded-lg bg-[var(--t2-warn-surface)] px-2.5 py-1.5 t2-fs-micro font-medium text-[var(--t2-warn)] ring-1 ring-[var(--t2-warn)]">
          {t("tour.juniorsUnder13")}
        </p>
      )}
      {hasAny ? (
        <div className="mt-1">
          {dl.entry && <DeadlineRow label={t("tour.entry")} date={dl.entry} />}
          {dl.withdrawal && <DeadlineRow label={t("tour.withdrawal")} date={dl.withdrawal} />}
          {dl.freezeVarianteA && <DeadlineRow label={t("tour.freeze")} date={dl.freezeVarianteA} suffix={freezeUnverified ? t("tour.freezeUnverified") : undefined} />}
          <p className="mt-2 t2-fs-meta text-[var(--t2-faint)]">{t("tour.tzHint")}</p>
        </div>
      ) : (
        <div className="mt-1 rounded-lg bg-[var(--t2-surface)] px-3 py-2.5">
          <p className="t2-fs-body-sm font-semibold text-[var(--t2-ink)]">{t("tour.challengerUnknownTitle")}</p>
          <p className="mt-0.5 t2-fs-micro leading-relaxed text-[var(--t2-muted)]">{t("tour.challengerUnknownText")}</p>
        </div>
      )}
    </div>
  );
}
