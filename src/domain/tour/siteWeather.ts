/**
 * Aktuelles Wetter am Welt-Ursprung — WMO-Code nach Open-Meteo.
 * Sonne aus Uhrzeit und Koordinaten, keine erfundenen Grad, keine 2027-Vorhersage.
 */

export type WeatherKind = "sun" | "cloudsun" | "cloud" | "rain";

export type SiteWeatherLook = {
  kind: WeatherKind;
  sky: string;
  horizon: string;
  fog: string;
  hemi: number;
  sun: number;
  rain: boolean;
  sunColor: string;
  /** 0 klar … 1 geschlossen — steuert Wolkendichte, keine erfundenen Okta. */
  cloudCover: number;
};

/** Szene: +x Osten, +y oben, +z Süden. Azimut 0 = Nord, im Uhrzeigersinn. */
export type SunDir = {
  x: number;
  y: number;
  z: number;
  elevation: number;
};

function julianDay(at: Date): number {
  return at.getTime() / 86_400_000 + 2_440_587.5;
}

/**
 * Sonnenstand (Meeus, vereinfacht). elevation in Radiant, azimuth 0 = Nord.
 */
export function sunPose(lat: number, lng: number, at: Date): { elevation: number; azimuth: number } {
  const rad = Math.PI / 180;
  const d = julianDay(at) - 2_451_545;
  const mean = (357.5291 + 0.98560028 * d) * rad;
  const center = 1.9148 * Math.sin(mean) + 0.02 * Math.sin(2 * mean) + 0.0003 * Math.sin(3 * mean);
  const ecliptic = (280.4665 + 0.98564736 * d + center) * rad;
  const eps = (23.439 - 0.00000036 * d) * rad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(ecliptic));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(ecliptic), Math.cos(ecliptic));
  const gmst = (18.697374558 + 24.06570982441908 * d) * 15 * rad;
  const lst = gmst + lng * rad;
  const ha = lst - ra;
  const phi = lat * rad;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  const azimuth = Math.atan2(
    Math.sin(ha),
    Math.cos(ha) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi),
  ) + Math.PI;
  return { elevation, azimuth };
}

export function sunDirScene(lat: number, lng: number, at: Date): SunDir {
  const { elevation, azimuth } = sunPose(lat, lng, at);
  const cl = Math.cos(elevation);
  return {
    x: Math.sin(azimuth) * cl,
    y: Math.sin(elevation),
    z: -Math.cos(azimuth) * cl,
    elevation,
  };
}

export function weatherKindFromCode(code: number): WeatherKind {
  if (code <= 1) return "sun";
  if (code <= 3) return "cloudsun";
  if (code <= 48) return "cloud";
  return "rain";
}

export function weatherLook(code: number, elevation = 0.85): SiteWeatherLook {
  const kind = weatherKindFromCode(code);
  const night = elevation < 0;
  const dusk = !night && elevation < 0.18;
  if (kind === "sun") {
    if (night) return { kind, sky: "#141c28", horizon: "#1a2434", fog: "#1a2430", hemi: 0.22, sun: 0.06, rain: false, sunColor: "#8aa0c0", cloudCover: 0 };
    if (dusk) return { kind, sky: "#e8a070", horizon: "#f0b080", fog: "#d8b090", hemi: 0.68, sun: 1.35, rain: false, sunColor: "#ffb068", cloudCover: 0 };
    return { kind, sky: "#5eacf0", horizon: "#e4f0d8", fog: "#c8dcc8", hemi: 0.4, sun: 2.7, rain: false, sunColor: "#fff3b8", cloudCover: 0 };
  }
  if (kind === "cloudsun") {
    if (night) return { kind, sky: "#161e28", horizon: "#1c2632", fog: "#1c2630", hemi: 0.24, sun: 0.08, rain: false, sunColor: "#90a4bc", cloudCover: 0 };
    if (dusk) return { kind, sky: "#d4a888", horizon: "#e0b898", fog: "#c8b8a0", hemi: 0.66, sun: 1.2, rain: false, sunColor: "#f0c090", cloudCover: 0 };
    return { kind, sky: "#6eb4f2", horizon: "#e0eed8", fog: "#c8d8c8", hemi: 0.4, sun: 2.55, rain: false, sunColor: "#fff2c0", cloudCover: 0 };
  }
  if (kind === "cloud") {
    if (night) return { kind, sky: "#121820", horizon: "#181e24", fog: "#181e24", hemi: 0.2, sun: 0.04, rain: false, sunColor: "#708090", cloudCover: 0 };
    return { kind, sky: "#8ab4d0", horizon: "#d0dcc8", fog: "#b8c8b8", hemi: 0.52, sun: 1.85, rain: false, sunColor: "#fff0d8", cloudCover: 0 };
  }
  if (night) return { kind, sky: "#10161c", horizon: "#151c20", fog: "#151c20", hemi: 0.18, sun: 0.03, rain: true, sunColor: "#6a7884", cloudCover: 0 };
  return { kind, sky: "#6e8e96", horizon: "#8a9890", fog: "#889490", hemi: 0.5, sun: 0.55, rain: true, sunColor: "#c8d0d4", cloudCover: 0 };
}
