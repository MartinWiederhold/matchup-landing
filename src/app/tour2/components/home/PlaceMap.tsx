"use client";

/**
 * Weltkarte von oben, rausgezoomt: Satellit (Esri), Pins für Saison-Stops
 * und autorisierte Welten. Welt-Pins fliegen schnell ins Gelände, bevor 3D übernimmt.
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "sat", type: "raster", source: "esri" }],
};

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
  const flyingId = useRef<string | null>(null);
  const onMoveEnd = useRef<(() => void) | null>(null);
  const flyTimer = useRef<number>(0);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!box.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: SATELLITE_STYLE,
      center: [0, 18],
      zoom: 1.35,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    const resize = () => map.resize();
    map.on("load", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(box.current);
    if (box.current.parentElement) ro.observe(box.current.parentElement);
    const later = [80, 400, 1200].map((ms) => window.setTimeout(resize, ms));
    return () => {
      later.forEach((id) => window.clearTimeout(id));
      if (onMoveEnd.current) map.off("moveend", onMoveEnd.current);
      if (flyTimer.current) window.clearTimeout(flyTimer.current);
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
          const map = mapRef.current;
          if (!map || pin.tone !== "world") {
            selectRef.current?.(pin.id);
            return;
          }
          if (onMoveEnd.current) map.off("moveend", onMoveEnd.current);
          flyingId.current = pin.id;
          el.classList.add("is-on");
          const finish = () => {
            if (flyingId.current !== pin.id) return;
            flyingId.current = null;
            if (onMoveEnd.current) {
              map.off("moveend", onMoveEnd.current);
              onMoveEnd.current = null;
            }
            selectRef.current?.(pin.id);
          };
          const onEnd = () => {
            if (map.getZoom() < 10) return;
            finish();
          };
          onMoveEnd.current = onEnd;
          map.on("moveend", onEnd);
          if (flyTimer.current) window.clearTimeout(flyTimer.current);
          flyTimer.current = window.setTimeout(finish, 1100);
          map.flyTo({
            center: [pin.lng, pin.lat],
            zoom: 15.5,
            pitch: 54,
            bearing: -22,
            duration: 820,
            essential: true,
            easing: (t) => 1 - (1 - t) ** 3,
          });
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
