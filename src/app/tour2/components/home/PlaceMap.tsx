"use client";

/**
 * Ein Place von oben: Satellit (Esri World Imagery), Kamera auf echte Koordinaten.
 * Kein Platz-Grundriss erfinden — nur das, was lat/lng hergibt.
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

export default function PlaceMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!box.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: SATELLITE_STYLE,
      center: [lng, lat],
      zoom: 15.2,
      attributionControl: { compact: true },
    });
    const el = document.createElement("div");
    el.className = "t2-place-pin";
    el.title = label;
    markerRef.current = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
    mapRef.current = map;
    const resize = () => map.resize();
    map.on("load", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(box.current);
    if (box.current.parentElement) ro.observe(box.current.parentElement);
    const later = [80, 400, 1200].map((ms) => window.setTimeout(resize, ms));
    return () => {
      later.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [lng, lat], zoom: 15.2, duration: 420 });
    markerRef.current?.setLngLat([lng, lat]);
  }, [lat, lng]);

  return <div ref={box} className="absolute inset-0 h-full w-full" />;
}
