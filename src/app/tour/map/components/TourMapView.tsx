"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useT, useLocale } from "@/lib/i18n";
import type { SeasonEntry } from "@/lib/tourSeason";

/**
 * Kachelquelle: OpenFreeMap (MapLibre-Vektorkacheln) — bewusst KEIN Leaflet/CARTO.
 * CARTOs Lizenz beschränkt die Basemap-Tiles auf Enterprise-Kunden und Non-Profit-
 * Grants; kommerzielle Nutzung ohne Enterprise-Lizenz ist nicht gedeckt (BACKLOG MU-024).
 * OpenFreeMap: kein API-Schlüssel, keine Abrufgrenze, kommerziell erlaubt. Style-URL aus
 * der OpenFreeMap-Quick-Start-Doku verifiziert. `positron` = zurückgenommener heller Style,
 * damit der Reiseweg nicht mit dem Kartenbild konkurriert (und nah an CARTOs light_all).
 */
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

// Kalendertag in UTC formatieren (keine Zeitzonen-Verschiebung).
function fmtMonday(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}
function esc(s: string | null): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Marker: Kreis; bei mehreren Wochen am selben Ort ein Anzahl-Badge (Cluster sichtbar).
function markerHtml(count: number): string {
  const badge = count > 1
    ? `<span style="position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 4px;border-radius:9999px;background:#4b3bf3;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);">${count}</span>`
    : "";
  return `<div style="position:relative;width:22px;height:22px;cursor:pointer;"><div style="width:22px;height:22px;border-radius:9999px;background:#4b3bf3;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>${badge}</div>`;
}

/** Prop-getrieben (anders als der /map-Monolith): bekommt die Koordinaten-Turniere fertig. */
export default function TourMapView({ entries }: { entries: SeasonEntry[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const { locale } = useLocale();

  useEffect(() => {
    if (!mapRef.current) return;

    const countryName = (code: string | null) => {
      if (!code) return "";
      const n = t(`tour.country.${code}`);
      return n.startsWith("tour.country.") ? code : n;
    };

    // Gruppierung nach Koordinate → ein Marker je Ort (Cluster = mehrere Wochen).
    const groups = new Map<string, { lng: number; lat: number; items: SeasonEntry[] }>();
    for (const e of entries) {
      const lat = e.tournament.latitude as number;
      const lng = e.tournament.longitude as number;
      const k = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (!groups.has(k)) groups.set(k, { lng, lat, items: [] });
      groups.get(k)!.items.push(e);
    }

    // Reiseweg: Koordinaten in Turnierwochen-Reihenfolge; aufeinanderfolgende gleiche
    // Orte zusammengezogen, echte Rücksprünge (A→B→A) bleiben sichtbar.
    const line: [number, number][] = [];
    let prevKey = "";
    for (const e of entries) {
      const lat = e.tournament.latitude as number;
      const lng = e.tournament.longitude as number;
      const k = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (k !== prevKey) { line.push([lng, lat]); prevKey = k; }
    }

    // Zoom-Buttons auf dem Handy vergrößern.
    const styleEl = document.createElement("style");
    styleEl.textContent = ".maplibregl-ctrl-group button{width:36px;height:36px;}";
    document.head.appendChild(styleEl);

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: OPENFREEMAP_STYLE,
      attributionControl: false, // eigene Attribution erzwingen (Style trägt keine inline)
      center: line[0],
      zoom: 3,
    });
    // PFLICHT-Attribution (OSM). Der positron-Style trägt sie nicht inline → explizit setzen.
    map.addControl(new maplibregl.AttributionControl({
      customAttribution: "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors",
    }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Reiseweg-Linie
      if (line.length > 1) {
        map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } } });
        map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#4b3bf3", "line-width": 3, "line-opacity": 0.9 } });
      }

      // Marker + Popups je Ort
      for (const g of groups.values()) {
        const first = g.items[0].tournament;
        const header = `<div style="font-weight:800;margin-bottom:4px;">${esc(first.city) || t("tour.fieldMissing")}${first.country ? ", " + esc(countryName(first.country)) : ""}</div>`;
        const rows = g.items.map((e) => {
          const x = e.tournament;
          const cat = x.category ? esc(x.category) : t("tour.fieldMissing");
          const surf = x.surface ? t(`tour.surface_${x.surface}`) : t("tour.fieldMissing");
          const series = x.series === "itf_wtt" ? t("tour.seriesItf") : t("tour.seriesChallenger");
          return `<div style="padding:2px 0;border-top:1px solid rgba(0,0,0,.06);"><div>${t("tour.mondayLabel")} ${fmtMonday(x.tournament_monday, locale)} · ${cat} · ${surf}</div><div style="color:#888;font-size:11px;">${series}</div></div>`;
        }).join("");
        const el = document.createElement("div");
        el.innerHTML = markerHtml(g.items.length);
        new maplibregl.Marker({ element: el })
          .setLngLat([g.lng, g.lat])
          .setPopup(new maplibregl.Popup({ offset: 18, maxWidth: "260px" }).setHTML(`<div style="font-size:13px;line-height:1.4;">${header}${rows}</div>`))
          .addTo(map);
      }

      // Auf alle Stationen zoomen (ein Ort → zentrieren; mehrere → fitBounds).
      if (groups.size === 1) {
        const only = [...groups.values()][0];
        map.setCenter([only.lng, only.lat]);
        map.setZoom(6);
      } else {
        const b = new maplibregl.LngLatBounds();
        for (const g of groups.values()) b.extend([g.lng, g.lat]);
        map.fitBounds(b, { padding: 60, maxZoom: 8, duration: 0 });
      }
    });

    return () => {
      map.remove();
      styleEl.remove();
    };
    // Sprache (locale) neu aufbauen, damit die Popups übersetzt bleiben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, locale]);

  return <div ref={mapRef} className="h-[70vh] min-h-[380px] w-full overflow-hidden rounded-2xl border border-black/[0.08]" />;
}
