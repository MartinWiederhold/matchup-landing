/**
 * Aktuelles Wetter am Welt-Ursprung — WMO-Code nach Open-Meteo.
 * Keine Turnier-Vorhersage, keine erfundenen Grad.
 */

export type WeatherKind = "sun" | "cloudsun" | "cloud" | "rain";

export type SiteWeatherLook = {
  kind: WeatherKind;
  sky: string;
  fog: string;
  hemi: number;
  sun: number;
  rain: boolean;
};

export function weatherKindFromCode(code: number): WeatherKind {
  if (code <= 1) return "sun";
  if (code <= 3) return "cloudsun";
  if (code <= 48) return "cloud";
  return "rain";
}

export function weatherLook(code: number): SiteWeatherLook {
  const kind = weatherKindFromCode(code);
  if (kind === "sun") {
    return { kind, sky: "#c8def0", fog: "#dce8d6", hemi: 1.05, sun: 1.72, rain: false };
  }
  if (kind === "cloudsun") {
    return { kind, sky: "#d2dce6", fog: "#d8e0dc", hemi: 0.98, sun: 1.35, rain: false };
  }
  if (kind === "cloud") {
    return { kind, sky: "#b8c2c8", fog: "#c5cdc8", hemi: 0.88, sun: 0.72, rain: false };
  }
  return { kind, sky: "#8fa0aa", fog: "#9aa8a4", hemi: 0.7, sun: 0.42, rain: true };
}
