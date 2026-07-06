"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as ML from "maplibre-gl";
import { VENUES, type Sport, type VenueCategory } from "@/lib/mapVenues";
import { initials, venueSlug } from "@/lib/venueUtils";

const SPORT_COLOR: Record<Sport, string> = {
  tennis: "#4b3bf3",
  padel: "#10b981",
  pickleball: "#f59e0b",
};
const SPORT_LABEL: Record<Sport, string> = {
  tennis: "Tennis",
  padel: "Padel",
  pickleball: "Pickleball",
};
const CAT_LABEL: Record<VenueCategory, string> = {
  club: "Club",
  public: "Öffentlich",
  private: "Privat",
  hotel: "Hotel",
};

const ZURICH: [number, number] = [8.5417, 47.3769];
const ML_VERSION = "4.7.1";

/** MapLibre vom CDN laden (Worker korrekt eingebaut → rendert auch dort, wo der
 *  gebündelte Worker unter Turbopack/Safari nicht lädt). */
function loadMaplibre(): Promise<typeof ML> {
  const w = window as unknown as { maplibregl?: typeof ML };
  if (w.maplibregl) return Promise.resolve(w.maplibregl);
  return new Promise((resolve, reject) => {
    if (!document.getElementById("ml-css")) {
      const link = document.createElement("link");
      link.id = "ml-css";
      link.rel = "stylesheet";
      link.href = `https://unpkg.com/maplibre-gl@${ML_VERSION}/dist/maplibre-gl.css`;
      document.head.appendChild(link);
    }
    const existing = document.getElementById("ml-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(w.maplibregl!));
      existing.addEventListener("error", reject);
      if (w.maplibregl) resolve(w.maplibregl);
      return;
    }
    const s = document.createElement("script");
    s.id = "ml-js";
    s.src = `https://unpkg.com/maplibre-gl@${ML_VERSION}/dist/maplibre-gl.js`;
    s.onload = () => resolve(w.maplibregl!);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function TennisBall({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="tb" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#eaff6a" />
          <stop offset="70%" stopColor="#c7e600" />
          <stop offset="100%" stopColor="#a6c400" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#tb)" />
      <path d="M14 22 C40 42 40 58 14 78" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M86 22 C60 42 60 58 86 78" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export default function MapView() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ML.Map | null>(null);
  const mlRef = useRef<typeof ML | null>(null);
  const markers = useRef<Map<number, ML.Marker>>(new Map());
  const [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(true);

  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);
  const [catFilter, setCatFilter] = useState<VenueCategory | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VENUES.map((v, i) => ({ v, i })).filter(({ v }) => {
      if (sportFilter && v.sport !== sportFilter) return false;
      if (catFilter && v.category !== catFilter) return false;
      if (q && !v.name.toLowerCase().includes(q) && !v.city.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [query, sportFilter, catFilter]);

  const focus = useCallback((i: number) => {
    setSelected(i);
    const v = VENUES[i];
    mapRef.current?.flyTo({ center: [v.lng, v.lat], zoom: 14.5, speed: 0.9 });
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMaplibre()
      .then((maplibregl) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        mlRef.current = maplibregl;
        const map = new maplibregl.Map({
          container: mapEl.current,
          style: {
            version: 8,
            sources: {
              carto: {
                type: "raster",
                tiles: [
                  "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                  "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                  "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap · © CARTO",
              },
            },
            layers: [{ id: "carto", type: "raster", source: "carto" }],
          },
          center: [8.2, 46.8],
          zoom: 2.2,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          try {
            map.setProjection({ type: "globe" });
          } catch {
            /* ältere Version → flach */
          }
          map.resize();
          setReady(true);
          window.setTimeout(() => {
            map.flyTo({ center: ZURICH, zoom: 11, speed: 0.5, curve: 1.6 });
          }, 1500);
        });
        [200, 700, 1500].forEach((ms) => window.setTimeout(() => map.resize(), ms));
        window.addEventListener("resize", () => map.resize());
      })
      .catch(() => {
        /* CDN nicht erreichbar */
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.current.clear();
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mlRef.current;
    if (!map || !maplibregl || !ready) return;
    const keep = new Set(visible.map((x) => x.i));
    for (const [i, m] of markers.current) {
      if (!keep.has(i)) {
        m.remove();
        markers.current.delete(i);
      }
    }
    for (const { v, i } of visible) {
      if (markers.current.has(i)) continue;
      const el = document.createElement("div");
      el.style.cssText = `width:34px;height:34px;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#111;box-shadow:0 4px 12px rgba(0,0,0,.22);border:3px solid ${SPORT_COLOR[v.sport]};cursor:pointer;transition:transform .15s;`;
      el.textContent = initials(v.name);
      el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.15)"));
      el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
      el.addEventListener("click", () => focus(i));
      const marker = new maplibregl.Marker({ element: el }).setLngLat([v.lng, v.lat]).addTo(map);
      markers.current.set(i, marker);
    }
  }, [visible, ready, focus]);

  useEffect(() => {
    for (const [i, m] of markers.current) {
      const el = m.getElement();
      const active = i === selected;
      el.style.zIndex = active ? "10" : "1";
      el.style.transform = active ? "scale(1.25)" : "scale(1)";
      el.style.boxShadow = active
        ? "0 0 0 4px rgba(75,59,243,.30),0 6px 16px rgba(0,0,0,.28)"
        : "0 4px 12px rgba(0,0,0,.22)";
    }
  }, [selected, visible]);

  const sel = selected != null ? VENUES[selected] : null;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-white text-neutral-900">
      {/* Sidebar */}
      <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="shrink-0 space-y-3 border-b border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <TennisBall className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">Zürich</span>
            <span className="ml-auto text-xs text-neutral-400">{visible.length} Orte</span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none focus:border-matchup"
          />
          <div className="flex flex-wrap gap-1.5">
            {([null, "tennis", "padel", "pickleball"] as const).map((s) => (
              <button
                key={s ?? "all"}
                type="button"
                onClick={() => setSportFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  sportFilter === s
                    ? "bg-matchup text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {s ? SPORT_LABEL[s] : "Alle"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([null, "club", "public", "private", "hotel"] as const).map((c) => (
              <button
                key={c ?? "allc"}
                type="button"
                onClick={() => setCatFilter(c)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  catFilter === c ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {c ? CAT_LABEL[c] : "Alle Typen"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visible.map(({ v, i }) => (
            <button
              key={i}
              type="button"
              onClick={() => focus(i)}
              className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                selected === i ? "bg-matchup/5" : ""
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-neutral-900 shadow-sm"
                style={{ border: `2.5px solid ${SPORT_COLOR[v.sport]}` }}
              >
                {initials(v.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{v.name}</span>
                <span className="block text-xs text-neutral-400">
                  {SPORT_LABEL[v.sport]} · {CAT_LABEL[v.category]}
                  {v.city ? ` · ${v.city}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Karte */}
      <div className="relative flex-1 bg-neutral-100">
        <div ref={mapEl} className="absolute inset-0" />

        {sel && (
          <div className="absolute bottom-4 left-4 right-4 z-[500] mx-auto max-w-md rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl ring-1 ring-neutral-200">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
              aria-label="Schliessen"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-neutral-900 shadow-sm"
                style={{ border: `3px solid ${SPORT_COLOR[sel.sport]}` }}
              >
                {initials(sel.name)}
              </span>
              <div className="min-w-0">
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: SPORT_COLOR[sel.sport], color: "#fff" }}
                >
                  {SPORT_LABEL[sel.sport]}
                </span>
                <h2 className="mt-1 truncate text-lg font-bold tracking-tight">{sel.name}</h2>
                <p className="text-xs text-neutral-500">
                  {CAT_LABEL[sel.category]}
                  {sel.city ? ` · ${sel.city}` : ""}
                </p>
              </div>
            </div>
            <a
              href={`/map/${venueSlug(sel, selected!)}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-matchup py-3 text-sm font-bold text-white hover:bg-matchup-hover"
            >
              Vollständiges Profil →
            </a>
          </div>
        )}
      </div>

      {/* Intro: Tennisball → Globus */}
      <div
        className={`pointer-events-none absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white transition-opacity duration-700 ${
          intro ? "opacity-100" : "opacity-0"
        }`}
      >
        <TennisBall className="h-28 w-28 animate-[spin_2.4s_linear_infinite] drop-shadow-xl" />
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em] text-neutral-400">
          Matchup Map
        </p>
      </div>
    </div>
  );
}
