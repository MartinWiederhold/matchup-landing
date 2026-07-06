"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

export default function MapView() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<number, { marker: maplibregl.Marker; el: HTMLDivElement }>>(
    new Map(),
  );
  const [ready, setReady] = useState(false);

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
    mapRef.current?.flyTo({ center: [v.lng, v.lat], zoom: 15, speed: 1 });
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [10, 30],
      zoom: 1.6,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      try {
        map.setProjection({ type: "globe" });
      } catch {
        /* ältere Version → flach */
      }
      setReady(true);
      window.setTimeout(() => {
        map.flyTo({ center: ZURICH, zoom: 11.5, speed: 0.8 });
      }, 700);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
  }, []);

  // Marker (kreisrunde Monogramm-Badges) mit den sichtbaren Venies abgleichen
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const keep = new Set(visible.map((x) => x.i));

    for (const [i, entry] of markers.current) {
      if (!keep.has(i)) {
        entry.marker.remove();
        markers.current.delete(i);
      }
    }
    for (const { v, i } of visible) {
      if (markers.current.has(i)) continue;
      const el = document.createElement("div");
      el.style.cssText = `width:34px;height:34px;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#111;box-shadow:0 4px 12px rgba(0,0,0,.28);border:3px solid ${SPORT_COLOR[v.sport]};cursor:pointer;transition:transform .15s;`;
      el.textContent = initials(v.name);
      el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.15)"));
      el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
      el.addEventListener("click", () => focus(i));
      const marker = new maplibregl.Marker({ element: el }).setLngLat([v.lng, v.lat]).addTo(map);
      markers.current.set(i, { marker, el });
    }
  }, [visible, ready, focus]);

  // Ausgewählten Marker hervorheben
  useEffect(() => {
    for (const [i, { el }] of markers.current) {
      const active = i === selected;
      el.style.zIndex = active ? "10" : "1";
      el.style.transform = active ? "scale(1.25)" : "scale(1)";
      el.style.boxShadow = active
        ? "0 0 0 4px rgba(75,59,243,.35), 0 6px 16px rgba(0,0,0,.35)"
        : "0 4px 12px rgba(0,0,0,.28)";
    }
  }, [selected, visible]);

  const sel = selected != null ? VENUES[selected] : null;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-neutral-950 text-white">
      {/* Sidebar */}
      <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-white/10">
        <div className="shrink-0 space-y-3 border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold tracking-tight">Zürich</span>
            <span className="text-xs text-white/40">{visible.length} Orte</span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="h-10 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-matchup"
          />
          <div className="flex flex-wrap gap-1.5">
            {([null, "tennis", "padel", "pickleball"] as const).map((s) => (
              <button
                key={s ?? "all"}
                type="button"
                onClick={() => setSportFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  sportFilter === s ? "bg-matchup text-white" : "bg-white/10 text-white/70"
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
                  catFilter === c ? "bg-white text-black" : "bg-white/5 text-white/50"
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
              className={`flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                selected === i ? "bg-white/10" : ""
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-black"
                style={{ border: `2.5px solid ${SPORT_COLOR[v.sport]}` }}
              >
                {initials(v.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{v.name}</span>
                <span className="block text-xs text-white/40">
                  {SPORT_LABEL[v.sport]} · {CAT_LABEL[v.category]}
                  {v.city ? ` · ${v.city}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Karte */}
      <div className="relative flex-1">
        <div ref={mapEl} className="absolute inset-0" />

        {sel && (
          <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-md rounded-2xl bg-neutral-900/95 p-5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60"
              aria-label="Schliessen"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-black"
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
                <p className="text-xs text-white/60">
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
    </div>
  );
}
