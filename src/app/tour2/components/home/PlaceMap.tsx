"use client";

/**
 * Weltkarte von oben: Esri-Satellit auf Globus, scharf (2x).
 * Welt-Pins öffnen sofort die 3D-Welt — kein Flug ins Luftbild.
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GLOBE_CENTER, GLOBE_STYLE, GLOBE_ZOOM } from "@/app/map/globeStyle";

export type PlacePin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  tone?: "season" | "world";
};

export default function PlaceMap({
  pins,
  selectedId,
  onSelect,
}: {
  pins: PlacePin[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, maplibregl.Marker>());
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!box.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: GLOBE_STYLE,
      center: GLOBE_CENTER,
      zoom: GLOBE_ZOOM,
      attributionControl: { compact: true },
      pixelRatio: Math.min(2, window.devicePixelRatio || 2),
      fadeDuration: 0,
      canvasContextAttributes: { antialias: true },
    });
    mapRef.current = map;
    const resize = () => {
      map.resize();
      map.setPixelRatio(Math.min(2, window.devicePixelRatio || 2));
    };
    map.on("load", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(box.current);
    if (box.current.parentElement) ro.observe(box.current.parentElement);
    const later = [80, 400, 1200].map((ms) => window.setTimeout(resize, ms));
    return () => {
      later.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      markers.current.forEach((m) => m.remove());
      markers.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const keep = new Set(pins.map((p) => p.id));
    for (const [id, m] of markers.current) {
      if (keep.has(id)) continue;
      m.remove();
      markers.current.delete(id);
    }
    for (const pin of pins) {
      let m = markers.current.get(pin.id);
      if (!m) {
        const el = document.createElement("button");
        el.type = "button";
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          selectRef.current?.(pin.id);
        });
        m = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(map);
        markers.current.set(pin.id, m);
      } else {
        m.setLngLat([pin.lng, pin.lat]);
      }
      const el = m.getElement();
      el.className = `t2-place-pin${pin.tone === "world" ? " is-world" : ""}${selectedId === pin.id ? " is-on" : ""}`;
      el.textContent = pin.label;
      el.title = pin.label;
    }
  }, [pins, selectedId]);

  return <div ref={box} className="absolute inset-0 h-full w-full" />;
}
