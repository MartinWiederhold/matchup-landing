"use client";

import { useT, useLocale } from "@/lib/i18n";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { decideTournament, type ReasonDirection } from "@/domain/tour/decide";
import type { TourTournament } from "@/lib/types";

// Vertrauenswert → drei Wortstufen (keine Prozentzahl, die Messgenauigkeit vortäuscht).
// Schwellen bewusst hier als benannte Konstanten: ≥0.7 belastbar, ≤0.35 kaum belastbar.
const CONFIDENCE_HIGH_MIN = 0.7;
const CONFIDENCE_LOW_MAX = 0.35;
function confidenceKey(v: number): "confidenceHigh" | "confidenceMedium" | "confidenceLow" {
  if (v >= CONFIDENCE_HIGH_MIN) return "confidenceHigh";
  if (v <= CONFIDENCE_LOW_MAX) return "confidenceLow";
  return "confidenceMedium";
}

// Richtung einer Begründung nur als dezente Farbnuance im vorhandenen Palettenrahmen.
// Bewusst KEIN Vorzeichen (+/−): ein Minus liest sich schnell als Fehler. Der einzige
// Akzent (Emerald) markiert das einzig echt Positive; alles andere bleibt in Grautönen.
function dotClass(d: ReasonDirection): string {
  return d === "dafuer" ? "bg-emerald-500" : d === "dagegen" ? "bg-neutral-400" : "bg-neutral-300";
}
function reasonTextClass(d: ReasonDirection): string {
  return d === "dafuer" ? "text-neutral-700" : d === "dagegen" ? "text-neutral-500" : "text-neutral-600";
}

// Turniermontag ist ein Kalendertag → in UTC formatieren, damit sich das Datum
// nicht durch die lokale Zeitzone verschiebt.
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}
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

export default function TournamentCard({ tournament: x }: { tournament: TourTournament }) {
  const t = useT();
  const { locale } = useLocale();

  const countryName = (() => {
    if (!x.country) return t("tour.fieldMissing");
    const n = t(`tour.country.${x.country}`);
    return n.startsWith("tour.country.") ? x.country : n; // ehrlicher Fallback auf ISO-Code
  })();
  const surfaceLabel = x.surface ? t(`tour.surface_${x.surface}`) : null;
  const hall = x.indoor === true ? t("tour.indoor") : x.indoor === false ? t("tour.outdoor") : null;

  // Fristen berechnen (Turniermontag als UTC-Mitternacht in die reine Domain-Funktion).
  const monday = new Date(x.tournament_monday + "T00:00:00Z");
  const dl = tourDeadlines(monday, x.series);

  // Einschätzung berechnen. Die aktuelle Zeit entsteht HIER (Client) und wird als
  // Parameter hereingereicht — die Domain-Funktion nutzt keine Systemuhr. /tour ist eine
  // Liste ohne Reisekette, deshalb OHNE cost-Teil (Kosten-Begründungen bleiben leer).
  const decision = decideTournament({
    tournament: { tournamentMonday: monday, series: x.series, category: x.category, place: x.city ?? "" },
    now: new Date(),
  });
  const confKey = confidenceKey(decision.confidence);

  return (
    <article className="rounded-2xl border border-black/[0.08] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            {x.city || t("tour.fieldMissing")}
            <span className="text-neutral-400">, </span>
            <span className="text-neutral-600">{countryName}</span>
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {x.series === "itf_wtt" ? t("tour.seriesItf") : t("tour.seriesChallenger")}
            {" · "}
            {t("tour.mondayLabel")} {fmtMonday(x.tournament_monday, locale)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-matchup/10 px-3 py-1 text-[12px] font-bold text-matchup">
          {x.category || t("tour.fieldMissing")}
        </span>
      </div>

      {/* Belag/Halle + Preisgeld */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-neutral-600">
        <span>
          {t("tour.surfaceLabel")}: {surfaceLabel ?? t("tour.fieldMissing")}
          {hall && <span className="text-neutral-400"> · {hall}</span>}
        </span>
        {x.prize_money && (
          <span>
            {t("tour.prizeLabel")}: {Number(x.prize_money).toLocaleString(locale === "de" ? "de-CH" : "en-GB")}
            {x.prize_currency ? ` ${x.prize_currency}` : ""}
          </span>
        )}
      </div>

      {/* Fristen */}
      <div className="mt-4 border-t border-black/[0.06] pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.deadlinesTitle")}</p>
        {dl.known && dl.entry && dl.withdrawal && dl.freezeVarianteA ? (
          <div className="mt-1">
            <DeadlineRow label={t("tour.entry")} date={dl.entry} />
            <DeadlineRow label={t("tour.withdrawal")} date={dl.withdrawal} />
            {/* Bewusst nur Variante A, sichtbar als ungeprüft markiert. */}
            <DeadlineRow label={t("tour.freeze")} date={dl.freezeVarianteA} suffix={t("tour.freezeUnverified")} />
            <p className="mt-2 text-[11px] text-neutral-400">{t("tour.tzHint")}</p>
          </div>
        ) : (
          // Challenger: Regel unbekannt — ehrlich anzeigen, nicht kaschieren.
          <div className="mt-1 rounded-lg bg-black/[0.035] px-3 py-2.5">
            <p className="text-[13px] font-semibold text-neutral-700">{t("tour.challengerUnknownTitle")}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{t("tour.challengerUnknownText")}</p>
          </div>
        )}
      </div>

      {/* Einschätzung (Turnier-Entscheider) — zurückhaltend, keine Ampel, keine Note */}
      <div className="mt-4 border-t border-black/[0.06] pt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.decide.title")}</p>
        {/* Ruhige Einordnungszeile + Verlässlichkeit als Wortstufe (keine Prozentzahl) */}
        <p className="mt-1 text-[14px] font-semibold text-neutral-800">{t(`tour.decide.cls.${decision.classification}`)}</p>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          {t("tour.decide.confidenceLabel")}: {t(`tour.decide.${confKey}`)}
        </p>

        {/* Begründungen — knapp, Richtung nur als kleine Farbnuance */}
        {decision.reasons.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {decision.reasons.map((r) => (
              <li key={r.code} className="flex items-baseline gap-2 text-[12.5px]">
                <span className={`mt-[5px] h-1 w-1 shrink-0 rounded-full ${dotClass(r.direction)}`} />
                <span className={reasonTextClass(r.direction)}>{t(`tour.decide.reason.${r.code}`)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Grenzen dieser Einschätzung — sichtbar, aber unaufgeregt (kein Fehler-Look) */}
        {decision.basisLuecken.length > 0 && (
          <div className="mt-2.5">
            <p className="text-[11px] font-semibold text-neutral-400">{t("tour.decide.lueckenTitle")}</p>
            <ul className="mt-0.5 space-y-0.5">
              {decision.basisLuecken.map((code) => (
                <li key={code} className="text-[11px] leading-relaxed text-neutral-400">{t(`tour.decide.luecke.${code}`)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
