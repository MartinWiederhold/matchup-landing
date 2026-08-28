"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SeasonStopT3, StopState } from "./types";

/**
 * Saisonkarte für /tour3 — MapLibre mit EIGENEM Style unter
 * `/tour3/map-style.json`. Der Stil ist warm, reduziert und ruhig, damit die
 * Route selbst der Held bleibt. Marker sind eigens gestaltete Pillen mit dem
 * Kategorie-Kürzel (nicht Standard-Stecknadeln); Farbe nach Zustand
 * (accent für den nächsten, danger für verpasst, sonst gedämpft).
 *
 * Beim Laden sanftes Einzoomen auf die Bounds (duration 800ms), kein harter
 * Sprung.
 */

export type SeasonMapT3Props = {
  stops: SeasonStopT3[];
  onSelect?: (id: string) => void;
  highlightId?: string | null;
};

// Kategorie-Kürzel wie in /tour2 — konsistent mit dem restlichen Produkt.
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

function readVar(el: HTMLElement | null, name: string, fallback: string): string {
  const root = el?.closest(".t3-root") as HTMLElement | null;
  if (!root) return fallback;
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || fallback;
}

function markerStyle(state: StopState, tokens: {
  accent: string; danger: string; text: string; textFaint: string; onAccent: string; surface: string;
}): { bg: string; fg: string; border: string } {
  if (state === "missed")  return { bg: tokens.danger,    fg: tokens.onAccent, border: tokens.surface };
  if (state === "current") return { bg: tokens.accent,    fg: tokens.onAccent, border: tokens.surface };
  if (state === "past")    return { bg: tokens.textFaint, fg: tokens.onAccent, border: tokens.surface };
  return { bg: tokens.text, fg: tokens.onAccent, border: tokens.surface };
}

export default function SeasonMapViewT3({ stops, onSelect, highlightId }: SeasonMapT3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(new Map());
  const clickRef = useRef(onSelect);
  clickRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // Token-Werte einmalig aus dem umgebenden .t3-root lesen.
    const tokens = {
      accent:    readVar(el, "--t3-accent",   "#4b3bf3"),
      danger:    readVar(el, "--t3-danger",   "#B42318"),
      text:      readVar(el, "--t3-text",     "#20201C"),
      textFaint: readVar(el, "--t3-text-4",   "#5C5850"),
      onAccent:  readVar(el, "--t3-on-accent","#ffffff"),
      surface:   readVar(el, "--t3-surface",  "#ffffff"),
    };

    // Marker mit gültigen Koordinaten in Reisereihenfolge — für die Route-Linie
    // aufeinanderfolgende gleiche Punkte zusammenziehen.
    const valid = stops.filter((s) => s.latitude != null && s.longitude != null);
    const line: [number, number][] = [];
    let prev = "";
    for (const s of valid) {
      const k = `${s.latitude!.toFixed(4)},${s.longitude!.toFixed(4)}`;
      if (k !== prev) { line.push([s.longitude!, s.latitude!]); prev = k; }
    }

    const map = new maplibregl.Map({
      container: el,
      style: "/tour3/map-style.json",   // eigener warmer Stil (public/tour3/map-style.json)
      attributionControl: false,
      center: line[0] ?? [8.55, 47.37],
      zoom: 2,
    });
    map.addControl(new maplibregl.AttributionControl({
      customAttribution: "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors",
    }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      // Route-Linie in Akzentfarbe, kräftig und durchgehend — sie ist der Held.
      if (line.length > 1) {
        map.addSource("t3-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } },
        });
        map.addLayer({
          id: "t3-route-halo",
          type: "line",
          source: "t3-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": tokens.surface, "line-width": 6, "line-opacity": 0.9 },
        });
        map.addLayer({
          id: "t3-route",
          type: "line",
          source: "t3-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": tokens.accent, "line-width": 3.2, "line-opacity": 0.95 },
        });
      }

      // Marker als schmale Pille mit Kategorie-Kürzel.
      markersRef.current.clear();
      for (const s of valid) {
        const c = markerStyle(s.state, tokens);
        const div = document.createElement("div");
        div.setAttribute("data-stop-id", s.id);
        div.style.cssText = [
          "display:flex", "align-items:center", "justify-content:center",
          "min-width:2.2rem", "height:1.6rem", "padding:0 0.4rem",
          "border-radius:999px", "font-family:var(--font-geist-mono, ui-monospace, monospace)",
          "font-size:10.5px", "font-weight:600", "letter-spacing:0.02em",
          `background:${c.bg}`, `color:${c.fg}`,
          `border:2px solid ${c.border}`,
          "cursor:pointer", "user-select:none",
          "transition:transform 180ms cubic-bezier(0.22,1,0.36,1)",
        ].join(";");
        div.textContent = categoryAbbr(s.category) || "·";
        div.setAttribute("role", "button");
        div.setAttribute("aria-label", `${s.city}${s.category ? " · " + s.category : ""}`);
        div.tabIndex = 0;
        const handle = () => clickRef.current?.(s.id);
        div.addEventListener("click", handle);
        div.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handle(); } });

        const marker = new maplibregl.Marker({ element: div })
          .setLngLat([s.longitude!, s.latitude!])
          .addTo(map);
        markersRef.current.set(s.id, { marker, el: div });
      }

      // Sanftes Einzoomen — kein harter Sprung. Bei einem einzelnen Stop
      // zentrieren, sonst fitBounds mit Übergang.
      if (valid.length === 1) {
        map.easeTo({ center: [valid[0].longitude!, valid[0].latitude!], zoom: 5.5, duration: 800 });
      } else if (valid.length > 1) {
        const b = new maplibregl.LngLatBounds();
        for (const s of valid) b.extend([s.longitude!, s.latitude!]);
        map.fitBounds(b, { padding: 70, maxZoom: 7, duration: 800 });
      }
    });

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // Karte wird bei jedem stops-Wechsel komplett neu aufgebaut — für den
    // Prototyp der einfachste Weg, konsistente Marker-States zu garantieren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  // Highlight-Wechsel ohne Karten-Rebuild — nur einen Marker skalieren.
  useEffect(() => {
    for (const [id, { el }] of markersRef.current) {
      const on = id === highlightId;
      el.style.transform = on ? "scale(1.22)" : "scale(1)";
      el.style.zIndex = on ? "10" : "1";
    }
  }, [highlightId]);

  return (
    <div
      ref={containerRef}
      className="h-[40vh] w-full overflow-hidden rounded-[var(--t3-radius)] border md:h-[55vh]"
      style={{ borderColor: "var(--t3-line)" }}
    />
  );
}
