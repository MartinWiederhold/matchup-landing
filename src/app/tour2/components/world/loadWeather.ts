"use client";

import { useEffect, useState } from "react";
import type { SiteWorld } from "@/domain/tour/siteWorld";
import { weatherKindFromCode, type WeatherKind } from "@/domain/tour/siteWeather";

export type SiteWeatherNow = {
  temp: number;
  code: number;
  kind: WeatherKind;
  source: "Open-Meteo";
};

export async function loadSiteWeather(lat: number, lng: number): Promise<SiteWeatherNow | null> {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
  const r = await fetch(u);
  if (!r.ok) return null;
  const d = await r.json() as {
    current?: { temperature_2m?: number; weather_code?: number };
  };
  const temp = d.current?.temperature_2m;
  const code = d.current?.weather_code;
  if (typeof temp !== "number" || typeof code !== "number") return null;
  return {
    temp: Math.round(temp),
    code,
    kind: weatherKindFromCode(code),
    source: "Open-Meteo",
  };
}

export function useSiteWeather(world: SiteWorld | null): SiteWeatherNow | null {
  const [wx, setWx] = useState<SiteWeatherNow | null>(null);
  useEffect(() => {
    if (!world) {
      setWx(null);
      return;
    }
    let stop = false;
    loadSiteWeather(world.origin.lat, world.origin.lng)
      .then((row) => { if (!stop) setWx(row); })
      .catch(() => { if (!stop) setWx(null); });
    return () => { stop = true; };
  }, [world]);
  return wx;
}
