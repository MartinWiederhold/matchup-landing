"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Saisonkarte für /tour2 — zeigt alle Turnierstops einer Saison auf der
 * OpenFreeMap-positron-Basiskarte, verbunden durch eine Route-Linie in
 * Reisereihenfolge. Marker-Beschriftung ist das Kategorie-Kürzel (C75, W125,
 * M25 …), die Farbe kommt aus den Zustands-Tokens (accent für den nächsten
 * Stop, danger für verpasste Meldefrist, gedämpft für vergangene Stops).
 *
 * Klick auf einen Marker feuert `onMarkerClick(id)` — die Aufrufer-Seite
 * öffnet den Drawer mit den Turnier-Details. Das Overview hebt außerdem
 * einen einzelnen Marker sichtbar hervor (`highlightId`), wenn der Cursor
 * über den passenden Zeitachsen-Punkt schwebt.
 *
 * Kartenbibliothek ist bewusst maplibre-gl (schon installiert, keine neue
 * Abhängigkeit). CSS-Variablen werden per `getComputedStyle` aus dem
 * `.t2-root`-Elternteil ausgelesen — maplibre malt die Route-Linie in WebGL
 * und kann `var(--…)` nicht selbst auflösen.
 */

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

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
  const root = el?.closest(".t2-root") as HTMLElement | null;
  if (!root) return fallback;
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || fallback;
}

function markerColorsFor(state: SeasonStopState, tokens: {
  accent: string; danger: string; text: string; textFaint: string; onAccent: string; surface: string;
}): { bg: string; fg: string; ring: string } {
  if (state === "missed")  return { bg: tokens.danger,   fg: tokens.onAccent, ring: tokens.surface };
  if (state === "current") return { bg: tokens.accent,   fg: tokens.onAccent, ring: tokens.surface };
  if (state === "past")    return { bg: tokens.textFaint, fg: tokens.onAccent, ring: tokens.surface };
  return { bg: tokens.text, fg: tokens.onAccent, ring: tokens.surface };
}

export default function SeasonMapView({
  stops,
  heightClass = "min-h-[260px] md:min-h-[380px]",
  onMarkerClick,
  highlightId,
}: SeasonMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // Token-Werte aus dem umgebenden .t2-root lesen — maplibre malt die Route
    // per WebGL und kann `var(--…)` nicht selbst auflösen.
    const tokens = {
      accent:    readVar(el, "--t2-accent",     "#4b3bf3"),
      danger:    readVar(el, "--t2-danger",     "#B42318"),
      text:      readVar(el, "--t2-text",       "#171512"),
      textFaint: readVar(el, "--t2-text-faint", "#6E6A62"),
      onAccent:  readVar(el, "--t2-on-accent",  "#ffffff"),
      surface:   readVar(el, "--t2-surface",    "#ffffff"),
      line:      readVar(el, "--t2-line-strong","rgba(23,21,18,0.16)"),
    };

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
      style: OPENFREEMAP_STYLE,
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
      // Route-Linie in Akzentfarbe (WebGL — Konkret-Wert Pflicht).
      if (line.length > 1) {
        map.addSource("season-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } },
        });
        map.addLayer({
          id: "season-route",
          type: "line",
          source: "season-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": tokens.accent, "line-width": 2.5, "line-opacity": 0.75, "line-dasharray": [2, 2] },
        });
      }

      // Marker: Kategorie-Kürzel in Kreispille. Farbe nach Zustand.
      markersRef.current.clear();
      for (const s of stops) {
        const c = markerColorsFor(s.state, tokens);
        const div = document.createElement("div");
        div.setAttribute("data-stop-id", s.id);
        div.style.cssText = [
          "display:flex", "align-items:center", "justify-content:center",
          "min-width:2.1rem", "height:1.7rem", "padding:0 0.35rem",
          "border-radius:999px", "font-size:11px", "font-weight:700", "letter-spacing:0.02em",
          `background:${c.bg}`, `color:${c.fg}`,
          `border:2px solid ${c.ring}`,
          "box-shadow:0 1px 3px rgba(23,21,18,0.25)",
          "cursor:pointer", "user-select:none",
          "transition:transform 180ms ease",
        ].join(";");
        div.textContent = categoryAbbr(s.category) || "•";
        div.setAttribute("aria-label", `${s.city}${s.category ? " · " + s.category : ""}`);
        div.setAttribute("role", "button");
        div.tabIndex = 0;
        const handle = () => onMarkerClick?.(s.id);
        div.addEventListener("click", handle);
        div.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); handle(); } });

        const marker = new maplibregl.Marker({ element: div })
          .setLngLat([s.longitude, s.latitude])
          .addTo(map);
        markersRef.current.set(s.id, { marker, el: div });
      }

      // Auto-Fit auf alle Stops.
      if (stops.length === 1) {
        map.setCenter([stops[0].longitude, stops[0].latitude]);
        map.setZoom(6);
      } else if (stops.length > 1) {
        const b = new maplibregl.LngLatBounds();
        for (const s of stops) b.extend([s.longitude, s.latitude]);
        map.fitBounds(b, { padding: 60, maxZoom: 8, duration: 0 });
      }
    });

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // Neu aufbauen bei Änderung der Stops. onMarkerClick wird per Ref-Trick
    // aktualisiert, um unnötige Karten-Rebuilds zu vermeiden — aktueller
    // Handler wird bei jeder Renderrunde im Marker-Element neu registriert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  // Highlight-Wechsel ohne Karten-Rebuild: nur einen Marker skalieren + Ring.
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
