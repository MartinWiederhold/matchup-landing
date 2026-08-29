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
  const prevHlRef = useRef<string | null>(null); // zuletzt hervorgehobener Stop (feature-state)
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

      // ── Turnier-Stops als geclusterte Quelle ────────────────────────
      // Statt eines DOM-Markers je Stop eine native GeoJSON-Quelle mit
      // MapLibres EINGEBAUTEM Clustering: bei geringem Zoom fallen nahe
      // beieinanderliegende Stops zu EINEM Kreis mit Anzahl zusammen (kein
      // Aufhäufen mehr), erst beim Hineinzoomen trennen sie sich wieder.
      map.addSource("season-stops", {
        type: "geojson",
        promoteId: "id",   // String-id als feature-id (für feature-state/Highlight)
        cluster: true,
        clusterRadius: 44, // px-Radius, ab dem nahe Stops zusammengefasst werden
        clusterMaxZoom: 6, // ab Zoom 7 steht jeder Stop einzeln
        data: {
          type: "FeatureCollection",
          features: stops.map((s) => ({
            type: "Feature" as const,
            id: s.id,
            properties: { id: s.id, state: s.state, label: categoryAbbr(s.category) || "•" },
            geometry: { type: "Point" as const, coordinates: [s.longitude, s.latitude] },
          })),
        },
      });

      // Cluster-Kreis (Akzent) — Radius wächst in Stufen mit der Anzahl.
      map.addLayer({
        id: "stops-cluster",
        type: "circle",
        source: "season-stops",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": tokens.accent,
          "circle-opacity": 0.92,
          "circle-radius": ["step", ["get", "point_count"], 13, 5, 16, 12, 20],
          "circle-stroke-width": 2,
          "circle-stroke-color": tokens.bg,
        },
      } as unknown as maplibregl.LayerSpecification);
      // Anzahl im Cluster.
      map.addLayer({
        id: "stops-cluster-count",
        type: "symbol",
        source: "season-stops",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
        },
        paint: { "text-color": tokens.onAccent },
      } as unknown as maplibregl.LayerSpecification);

      // Einzelner Stop: KLEINER Punkt, Farbe nach Zustand. GENAU vier Farben,
      // keine weiteren:
      //   missed  → danger    (verpasster Meldeschluss)
      //   current → accent    (nächster/aktueller Stop)
      //   past    → textFaint (gedämpft neutral, bereits gespielt)
      //   planned → text      (normales Neutral, Default)
      // Hervorgehobener Stop (Hover/Auswahl) wächst per feature-state „hl".
      map.addLayer({
        id: "stops-point",
        type: "circle",
        source: "season-stops",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["match", ["get", "state"],
            "missed", tokens.danger,
            "current", tokens.accent,
            "past", tokens.textFaint,
            /* planned + Default */ tokens.text,
          ],
          "circle-radius": ["case", ["boolean", ["feature-state", "hl"], false], 8, 5],
          "circle-stroke-width": ["case", ["boolean", ["feature-state", "hl"], false], 3, 1.5],
          "circle-stroke-color": tokens.bg,
        },
      } as unknown as maplibregl.LayerSpecification);

      // Kleines Kategorie-Kürzel unter dem Punkt. Kollidierende Labels blendet
      // MapLibre selbst aus — so bleibt die Karte auch dicht lesbar.
      map.addLayer({
        id: "stops-label",
        type: "symbol",
        source: "season-stops",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: {
          "text-color": tokens.text,
          "text-halo-color": tokens.bg,
          "text-halo-width": 1.5,
        },
      } as unknown as maplibregl.LayerSpecification);

      // Klick auf Cluster → auf die Auflöse-Zoomstufe zoomen (Cluster öffnet sich).
      map.on("click", "stops-cluster", (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ["stops-cluster"] })[0];
        const cid = f?.properties?.cluster_id;
        if (cid == null) return;
        const src = map.getSource("season-stops") as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(cid).then((z) => {
          const geo = f.geometry as unknown as { coordinates: [number, number] };
          map.easeTo({ center: geo.coordinates, zoom: z, duration: 600 });
        }).catch(() => {});
      });
      // Klick auf einzelnen Stop → Drawer der Aufrufer-Seite öffnen.
      map.on("click", "stops-point", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id != null) clickRef.current?.(String(id));
      });
      for (const lid of ["stops-cluster", "stops-point"]) {
        map.on("mouseenter", lid, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", lid, () => { map.getCanvas().style.cursor = ""; });
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
      map.remove();
      mapRef.current = null;
    };
    // Neu aufbauen bei Änderung der Stops oder Variante. onMarkerClick wird
    // per Ref-Trick aktualisiert, um unnötige Karten-Rebuilds zu vermeiden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, variant, styleUrl]);

  // Highlight-Wechsel ohne Karten-Rebuild: nur den betroffenen Stop per
  // feature-state „hl" markieren — der Circle-Layer vergrößert ihn dann.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("season-stops")) return;
    if (prevHlRef.current && prevHlRef.current !== highlightId) {
      map.setFeatureState({ source: "season-stops", id: prevHlRef.current }, { hl: false });
    }
    if (highlightId) {
      map.setFeatureState({ source: "season-stops", id: highlightId }, { hl: true });
    }
    prevHlRef.current = highlightId ?? null;
  }, [highlightId]);

  return (
    <div
      ref={containerRef}
      className={`${heightClass} w-full overflow-hidden rounded-[var(--t2-radius-md)] border border-[var(--t2-line)]`}
    />
  );
}
