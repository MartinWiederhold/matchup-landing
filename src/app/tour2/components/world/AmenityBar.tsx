"use client";

import { useT } from "@/lib/i18n";
import type { SiteWeatherNow } from "./loadWeather";

export type AmenityFilter = "all" | "restroom" | "firstaid" | "water" | "food" | "access" | "service";

const FILTERS: AmenityFilter[] = ["all", "restroom", "firstaid", "water", "food", "access", "service"];

export default function AmenityBar({
  filter,
  onFilter,
  weather,
}: {
  filter: AmenityFilter;
  onFilter: (f: AmenityFilter) => void;
  weather: SiteWeatherNow | null;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          aria-pressed={filter === f}
          className={`t2-place-pill ${filter === f ? "" : "is-soft"}`}
          onClick={() => onFilter(f)}
        >
          {t(`tour.t2worldFilter_${f}`)}
        </button>
      ))}
      {weather && (
        <p className="t2-place-pill is-soft" title={t("tour.t2worldWeatherSource")}>
          {t("tour.t2worldWeather", {
            temp: weather.temp,
            sky: t(`tour.t2worldWeather_${weather.kind}`),
          })}
        </p>
      )}
    </div>
  );
}
