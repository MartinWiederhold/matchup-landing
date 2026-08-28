"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Saisonkarte für /tour2 — MapLibre-basierte Kartenansicht mit den Turnier-
 * Stops einer Saison, verbunden durch eine Route-Linie in Reisereihenfolge.
 * Marker-Beschriftung ist das Kategorie-Kürzel (C75, W125, M25 …), die Farbe
 * kommt aus den Zustands-Tokens.
 *
 * Zwei Varianten:
 *   variant="light" (Default) — Positron-Kacheln, dünne Route.
 *   variant="dark"            — eigener dunkler Farb-Stil aus
 *                                `/tour2/map-style-dark.json` mit doppelter
 *                                Route (Halo + Kern) für den Cockpit-Look.
 *
 * CSS-Variablen werden per `getComputedStyle` aus dem `.t2-root`- bzw.
 * `.t2-dark`-Vorfahren gelesen — maplibre malt die Route-Linie in WebGL und
 * kann `var(--…)` nicht selbst auflösen.
 *
 * Klick auf einen Marker feuert `onMarkerClick(id)` — die Aufrufer-Seite
 * öffnet den Drawer mit den Turnier-Details.
 */

const DEFAULT_LIGHT_STYLE = "https://tiles.openfreemap.org/styles/positron";
const DEFAULT_DARK_STYLE = "/tour2/map-style-dark.json";

export type SeasonStopState = "past" | "current" | "planned" | "missed";

export type SeasonStop = {
  id: string;
  city: string;              // schon per displayCity normalisiert
  countryCode: string | null;
  category: string | null;
  monday: string;             // ISO-Datum
  latitude: number;
  longitude: number;
  state: SeasonStopState;
};

export type SeasonMapProps = {
  stops: SeasonStop[];
  heightClass?: string;
  onMarkerClick?: (id: string) => void;
  highlightId?: string | null;
  variant?: "light" | "dark";
  styleUrl?: string;          // optional: manueller Style-URL/Pfad
};

// Kategorie-Kürzel für die Marker-Beschriftung.
//   „ATP Challenger 75"  → „C75"
//   „ITF M25"            → „M25"
//   „WTA 125"            → „W125"
//   „ATP 500"            → „A500"
function categoryAbbr(c: string | null): string {
  if (!c) return "";
  return c
    .replace(/^ATP\s+Challenger\s*/i, "C")
    .replace(/^Challenger\s*/i, "C")
    .replace(/^ITF\s+/i, "")
    .replace(/^WTA\s*/i, "W")
    .replace(/^ATP\s+/i, "A")
    .trim()
    .slice(0, 6);
}

// CSS-Variable aus dem umgebenden .t2-root-Element auflösen. Fallback: sinnvolle
// Farbe, damit die Karte auch außerhalb des Kontexts nutzbar bleibt.
function readVar(el: HTMLElement | null, name: string, fallback: string): string {
  const root = el?.closest(".t2-root, .t2-dark") as HTMLElement | null;
  if (!root) return fallback;
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || fallback;
}

type Tokens = {
  accent: string; danger: string; text: string; textFaint: string;
  onAccent: string; surface: string; bg: string; line: string;
};

function readTokens(el: HTMLElement | null): Tokens {
  return {
    accent:    readVar(el, "--t2-accent",     "#4b3bf3"),
    danger:    readVar(el, "--t2-danger",     "#B42318"),
    text:      readVar(el, "--t2-text",       "#171512"),
    textFaint: readVar(el, "--t2-text-faint", "#6E6A62"),
    onAccent:  readVar(el, "--t2-on-accent",  "#ffffff"),
    surface:   readVar(el, "--t2-surface",    "#ffffff"),
    bg:        readVar(el, "--t2-bg",         "#F7F6F3"),
    line:      readVar(el, "--t2-line-strong","rgba(23,21,18,0.16)"),
  };
}

function markerColorsFor(state: SeasonStopState, tokens: Tokens): { bg: string; fg: string; ring: string } {
  if (state === "missed")  return { bg: tokens.danger,    fg: tokens.onAccent, ring: tokens.bg };
  if (state === "current") return { bg: tokens.accent,    fg: tokens.onAccent, ring: tokens.bg };
  if (state === "past")    return { bg: tokens.textFaint, fg: tokens.onAccent, ring: tokens.bg };
  return { bg: tokens.text, fg: tokens.onAccent, ring: tokens.bg };
}

export default function SeasonMapView({
  stops,
  heightClass = "min-h-[260px] md:min-h-[380px]",
  onMarkerClick,
  highlightId,
  variant = "light",
  styleUrl,
}: SeasonMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(new Map());
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const tokens = readTokens(el);
    const style = styleUrl ?? (variant === "dark" ? DEFAULT_DARK_STYLE : DEFAULT_LIGHT_STYLE);

    // Route-Koordinaten in Reisereihenfolge, aufeinanderfolgende gleiche
    // Punkte werden zusammengezogen (echte Rücksprünge bleiben sichtbar).
    const line: [number, number][] = [];
    let prev = "";
    for (const s of stops) {
      const k = `${s.latitude.toFixed(4)},${s.longitude.toFixed(4)}`;
      if (k !== prev) { line.push([s.longitude, s.latitude]); prev = k; }
    }

    const map = new maplibregl.Map({
      container: el,
      style,
      attributionControl: false,
      center: line[0] ?? [8.55, 47.37],
      zoom: 3,
    });
    map.addControl(new maplibregl.AttributionControl({
      customAttribution: "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors",
    }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      // Route-Linie. Im Dark-Cockpit liegt eine weite, weiche Halo-Ebene
      // unter der scharfen Akzent-Linie — dadurch leuchtet die Route ohne
      // Filter-Effekt (WebGL kennt keinen CSS-blur).
      if (line.length > 1) {
        map.addSource("season-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } },
        });
        if (variant === "dark") {
          map.addLayer({
            id: "season-route-halo-wide",
            type: "line",
            source: "season-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": tokens.accent, "line-width": 14, "line-opacity": 0.14, "line-blur": 4 },
          });
          map.addLayer({
            id: "season-route-halo",
            type: "line",
            source: "season-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": tokens.accent, "line-width": 7, "line-opacity": 0.3, "line-blur": 2 },
          });
          map.addLayer({
            id: "season-route",
            type: "line",
            source: "season-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": tokens.accent, "line-width": 2.4, "line-opacity": 1 },
          });
        } else {
          map.addLayer({
            id: "season-route",
            type: "line",
            source: "season-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": tokens.accent, "line-width": 2.5, "line-opacity": 0.75, "line-dasharray": [2, 2] },
          });
        }
      }

      // Marker: Kategorie-Kürzel in Pille. Im Dark-Cockpit mit Akzent-Glow.
      markersRef.current.clear();
      for (const s of stops) {
        const c = markerColorsFor(s.state, tokens);
        const div = document.createElement("div");
        div.setAttribute("data-stop-id", s.id);

        const isDark = variant === "dark";
        const isCurrent = s.state === "current";
        const glow = isDark && isCurrent
          ? `0 0 0 3px ${tokens.bg}, 0 0 22px ${tokens.accent}`
          : isDark
            ? `0 0 0 2px ${tokens.bg}, 0 1px 3px rgba(0,0,0,0.4)`
            : "0 1px 3px rgba(23,21,18,0.25)";

        div.style.cssText = [
          "display:flex", "align-items:center", "justify-content:center",
          "min-width:2.15rem", "height:1.7rem", "padding:0 0.4rem",
          "border-radius:999px",
          "font-size:11px", "font-weight:700", "letter-spacing:0.02em",
          `background:${c.bg}`, `color:${c.fg}`,
          `border:1px solid ${isDark ? "rgba(255,255,255,0.14)" : c.ring}`,
          `box-shadow:${glow}`,
          "cursor:pointer", "user-select:none",
          "transition:transform 180ms cubic-bezier(0.22,1,0.36,1)",
        ].join(";");
        div.textContent = categoryAbbr(s.category) || "•";
        div.setAttribute("aria-label", `${s.city}${s.category ? " · " + s.category : ""}`);
        div.setAttribute("role", "button");
        div.tabIndex = 0;
        const handle = () => clickRef.current?.(s.id);
        div.addEventListener("click", handle);
        div.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); handle(); } });

        const marker = new maplibregl.Marker({ element: div })
          .setLngLat([s.longitude, s.latitude])
          .addTo(map);
        markersRef.current.set(s.id, { marker, el: div });
      }

      // Sanftes Auto-Fit — kein harter Sprung.
      if (stops.length === 1) {
        map.easeTo({ center: [stops[0].longitude, stops[0].latitude], zoom: 5.5, duration: 700 });
      } else if (stops.length > 1) {
        const b = new maplibregl.LngLatBounds();
        for (const s of stops) b.extend([s.longitude, s.latitude]);
        map.fitBounds(b, { padding: 70, maxZoom: 8, duration: 700 });
      }
    });

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // Neu aufbauen bei Änderung der Stops oder Variante. onMarkerClick wird
    // per Ref-Trick aktualisiert, um unnötige Karten-Rebuilds zu vermeiden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, variant, styleUrl]);

  // Highlight-Wechsel ohne Karten-Rebuild: nur einen Marker skalieren + Glow.
  useEffect(() => {
    for (const [id, { el }] of markersRef.current) {
      const on = id === highlightId;
      el.style.transform = on ? "scale(1.25)" : "scale(1)";
      el.style.zIndex = on ? "10" : "1";
    }
  }, [highlightId]);

  return (
    <div
      ref={containerRef}
      className={`${heightClass} w-full overflow-hidden rounded-[var(--t2-radius-md)] border border-[var(--t2-line)]`}
    />
  );
}
