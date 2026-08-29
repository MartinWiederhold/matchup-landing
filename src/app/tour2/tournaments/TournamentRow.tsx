"use client";

import { useT, useLocale } from "@/lib/i18n";
import type { TourTournament } from "@/lib/types";

function fmtDay(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

// Belag → Rollenfarbe (Farbe = Bedeutung). Fallback: neutrale Linie.
function surfaceToken(surface: string | null): string {
  const s = (surface || "").toLowerCase();
  if (s.includes("clay") || s.includes("sand")) return "var(--t2-clay)";
  if (s.includes("grass") || s.includes("rasen")) return "var(--t2-grass)";
  if (s.includes("carpet") || s.includes("indoor") || s.includes("halle")) return "var(--t2-indoor)";
  if (s.includes("hard")) return "var(--t2-hard)";
  return "var(--t2-line-strong)";
}

export default function TournamentRow({
  tt,
  countryName,
  selected,
  inSeason,
  weekEnd,
  prize,
  deadline,
  cost,
  pts,
  onSelect,
  onToggle,
}: {
  tt: TourTournament;
  countryName: string;
  selected: boolean;
  inSeason: boolean;
  weekEnd: string;
  prize: string | null;
  deadline: string;
  cost: string | null;
  pts: number;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const series = tt.series === "itf_wtt" ? t("tour.seriesItf") : tt.series === "itf_juniors" ? t("tour.seriesJuniors") : tt.series === "wta" ? t("tour.seriesWta") : t("tour.seriesChallenger");
  const surface = tt.surface ? t(`tour.surface_${tt.surface}`) : t("tour.fieldMissing");
  const surfaceVar = surfaceToken(tt.surface);

  return (
    <div
      className={`flex h-full items-start gap-2 px-1 py-2 border-l-[3px] ${selected ? "bg-[color-mix(in_srgb,var(--t2-accent)_8%,transparent)]" : ""}`}
      style={{ borderLeftColor: selected ? "var(--t2-accent)" : surfaceVar }}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate t2-fs-body font-semibold tracking-tight">
          {tt.city || t("tour.fieldMissing")}
          <span className="text-[var(--t2-muted)]">, {countryName}</span>
        </p>
        <p className="t2-fs-meta text-[var(--t2-muted)]">
          {t("tour.t2findColWeek")} {fmtDay(tt.tournament_monday, locale)}–{fmtDay(weekEnd, locale)}
          {" · "}{tt.category || "—"}
          {" · "}
          <span className="inline-flex items-center gap-1 align-baseline">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: surfaceVar }} aria-hidden />
            {surface}
          </span>
          {" · "}{series}
        </p>
        <p className="mt-0.5 truncate t2-fs-meta text-[var(--t2-muted)]">
          {t("tour.prizeLabel")}: {prize ?? "—"}
          {" · "}{deadline}
          {" · "}{cost ?? "—"}
          {pts > 0 ? ` · ${t("tour.t2ptsAssume", { n: pts })}` : ""}
        </p>
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={inSeason ? t("tour.seasonRemove") : t("tour.addToSeason")}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full t2-fs-body font-bold transition-colors ${inSeason ? "bg-[var(--t2-accent)] text-[var(--t2-on-accent)]" : "border border-[var(--t2-line-strong)] text-[var(--t2-text-soft)] hover:border-[var(--t2-accent)] hover:text-[var(--t2-accent)]"}`}
      >
        {inSeason ? "✓" : "+"}
      </button>
    </div>
  );
}
