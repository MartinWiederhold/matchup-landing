"use client";

/**
 * Play-Weltkarte unter /app → Map: zuerst dieselbe Kugel wie /tournaments,
 * nach Stadt-Tipp oder Reinzoomen moderne Vektor-Straßenkarte (OpenFreeMap Liberty).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  initials,
  primarySport,
  SPORT_COLOR,
  SPORT_LABEL,
  VENUE_SELECT,
  type Venue,
} from "@/lib/venuesDb";
import { GLOBE_CENTER, GLOBE_STYLE, GLOBE_ZOOM, STREET_FROM_ZOOM, STREET_STYLE } from "./globeStyle";

type CityHub = { id: string; name: string; lat: number; lng: number; n: number };

function cityHubs(venues: Venue[]): CityHub[] {
  const buckets = new Map<string, { lat: number; lng: number; n: number; name: string }>();
  for (const v of venues) {
    if (v.lat == null || v.lng == null || !v.city) continue;
    const key = `${v.city}|${v.country ?? ""}`;
    const hit = buckets.get(key);
    if (hit) {
      hit.lat += v.lat;
      hit.lng += v.lng;
      hit.n += 1;
    } else {
      buckets.set(key, { lat: v.lat, lng: v.lng, n: 1, name: v.city });
    }
  }
  return [...buckets.entries()]
    .map(([id, b]) => ({ id, name: b.name, lat: b.lat / b.n, lng: b.lng / b.n, n: b.n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 72);
}

function nearby(venues: Venue[], lng: number, lat: number, limit: number): Venue[] {
  return venues
    .filter((v) => v.lat != null && v.lng != null)
    .map((v) => ({ v, d: Math.hypot((v.lng as number) - lng, (v.lat as number) - lat) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((row) => row.v);
}

export default function PlayEarthMap() {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const streetRef = useRef(false);
  const cityMarks = useRef(new Map<string, maplibregl.Marker>());
  const venueMarks = useRef(new Map<string, maplibregl.Marker>());
  const venuesRef = useRef<Venue[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [street, setStreet] = useState(false);
  const [sel, setSel] = useState<Venue | null>(null);
  const [globeTick, setGlobeTick] = useState(0);
  venuesRef.current = venues;
  const hubs = useMemo(() => cityHubs(venues), [venues]);

  useEffect(() => {
    supabase.from("venues").select(VENUE_SELECT).order("name").limit(25000)
      .then(({ data }) => setVenues((data as Venue[]) ?? []));
  }, []);

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
    const enter = (lng: number, lat: number, zoom: number) => {
      if (streetRef.current) {
        map.flyTo({ center: [lng, lat], zoom, pitch: 46, bearing: -14, duration: 1100 });
        return;
      }
      streetRef.current = true;
      setStreet(true);
      setSel(null);
      cityMarks.current.forEach((m) => m.remove());
      cityMarks.current.clear();
      map.setStyle(STREET_STYLE);
      map.once("style.load", () => {
        map.setProjection({ type: "mercator" });
        map.flyTo({ center: [lng, lat], zoom, pitch: 46, bearing: -14, duration: 1400 });
        paintVenues(map);
      });
    };
    const onZoom = () => {
      if (streetRef.current) return;
      if (map.getZoom() < STREET_FROM_ZOOM) return;
      const c = map.getCenter();
      enter(c.lng, c.lat, Math.max(map.getZoom(), 11.4));
    };
    map.on("zoomend", onZoom);
    map.on("moveend", () => {
      if (streetRef.current) paintVenues(map);
    });
    const resize = () => {
      map.resize();
      map.setPixelRatio(Math.min(2, window.devicePixelRatio || 2));
    };
    map.on("load", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(box.current);
    const later = [80, 400, 1200].map((ms) => window.setTimeout(resize, ms));
    return () => {
      later.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      map.off("zoomend", onZoom);
      cityMarks.current.forEach((m) => m.remove());
      venueMarks.current.forEach((m) => m.remove());
      cityMarks.current.clear();
      venueMarks.current.clear();
      map.remove();
      mapRef.current = null;
      streetRef.current = false;
    };
  }, []);

  const paintVenues = (map: maplibregl.Map) => {
    const c = map.getCenter();
    const shown = nearby(venuesRef.current, c.lng, c.lat, 90);
    const keep = new Set(shown.map((v) => v.id));
    for (const [id, m] of venueMarks.current) {
      if (keep.has(id)) continue;
      m.remove();
      venueMarks.current.delete(id);
    }
    for (const v of shown) {
      if (v.lat == null || v.lng == null) continue;
      let m = venueMarks.current.get(v.id);
      if (!m) {
        const el = document.createElement("button");
        el.type = "button";
        el.style.cssText = "width:32px;height:32px;border-radius:999px;background:#fff;border:3px solid #4b3bf3;box-shadow:0 4px 12px rgba(0,0,0,.18);overflow:hidden;padding:0;";
        const color = SPORT_COLOR[primarySport(v)] ?? "#4b3bf3";
        el.style.borderColor = color;
        if (v.logo_url) {
          const img = document.createElement("img");
          img.src = v.logo_url;
          img.alt = "";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;";
          el.appendChild(img);
        } else {
          el.textContent = initials(v.name);
          el.style.font = "800 10px system-ui,sans-serif";
        }
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setSel(v);
        });
        m = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([v.lng, v.lat]).addTo(map);
        venueMarks.current.set(v.id, m);
      }
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || streetRef.current) return;
    const keep = new Set(hubs.map((h) => h.id));
    for (const [id, m] of cityMarks.current) {
      if (keep.has(id)) continue;
      m.remove();
      cityMarks.current.delete(id);
    }
    for (const hub of hubs) {
      let m = cityMarks.current.get(hub.id);
      if (!m) {
        const el = document.createElement("button");
        el.type = "button";
        el.style.cssText = "border:0;border-radius:999px;background:#fff;color:#111;font:700 12px system-ui,sans-serif;padding:6px 10px;box-shadow:0 6px 18px rgba(0,0,0,.22);white-space:nowrap;";
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const live = mapRef.current;
          if (!live) return;
          if (streetRef.current) {
            live.flyTo({ center: [hub.lng, hub.lat], zoom: 12.4, pitch: 46, bearing: -14, duration: 1100 });
            return;
          }
          streetRef.current = true;
          setStreet(true);
          setSel(null);
          cityMarks.current.forEach((mark) => mark.remove());
          cityMarks.current.clear();
          live.setStyle(STREET_STYLE);
          live.once("style.load", () => {
            live.setProjection({ type: "mercator" });
            live.flyTo({ center: [hub.lng, hub.lat], zoom: 12.4, pitch: 46, bearing: -14, duration: 1400 });
            paintVenues(live);
          });
        });
        m = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([hub.lng, hub.lat]).addTo(map);
        cityMarks.current.set(hub.id, m);
      }
      const el = m.getElement();
      el.textContent = `${hub.name} · ${t("app.earthCityClubs", { n: hub.n })}`;
    }
  }, [hubs, t, globeTick]);

  const backGlobe = () => {
    const map = mapRef.current;
    if (!map) return;
    streetRef.current = false;
    setStreet(false);
    setSel(null);
    venueMarks.current.forEach((m) => m.remove());
    venueMarks.current.clear();
    map.setStyle(GLOBE_STYLE);
    map.once("style.load", () => {
      map.setProjection({ type: "vertical-perspective" });
      map.easeTo({ center: GLOBE_CENTER, zoom: GLOBE_ZOOM, pitch: 0, bearing: 0, duration: 900 });
      setGlobeTick((n) => n + 1);
    });
  };

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={box} className="absolute inset-0 h-full w-full" />
      {street && (
        <button
          type="button"
          onClick={backGlobe}
          className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-bold text-neutral-800 shadow-lg ring-1 ring-neutral-200"
        >
          {t("app.earthBackGlobe")}
        </button>
      )}
      {sel && (
        <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-black/5">
          <button type="button" onClick={() => setSel(null)} className="absolute right-4 top-3 text-lg text-neutral-400" aria-label={t("app.cancel")}>✕</button>
          <div className="flex items-center gap-3">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-extrabold shadow-sm"
              style={{ border: `2.5px solid ${SPORT_COLOR[primarySport(sel)] ?? "#4b3bf3"}` }}
            >
              {sel.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sel.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(sel.name)
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold">{sel.name}</span>
              <span className="block truncate text-xs text-neutral-500">
                {sel.sports.map((s) => SPORT_LABEL[s] ?? s).join(" · ")}
                {sel.city ? ` · ${sel.city}` : ""}
              </span>
            </span>
          </div>
          {sel.slug && (
            <a href={`/map/${sel.slug}`} className="mt-3 block w-full rounded-full bg-matchup py-2.5 text-center text-sm font-bold text-white">
              {t("app.earthOpenClub")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
