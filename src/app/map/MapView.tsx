"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

const ZURICH: [number, number] = [47.3769, 8.5417];

function markerIcon(sport: Sport, name: string, active: boolean): L.DivIcon {
  const shadow = active
    ? "box-shadow:0 0 0 4px rgba(75,59,243,.30),0 6px 16px rgba(0,0,0,.28);"
    : "box-shadow:0 4px 12px rgba(0,0,0,.18);";
  const scale = active ? "transform:scale(1.22);" : "";
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#111;border:3px solid ${SPORT_COLOR[sport]};${shadow}${scale}transition:transform .15s;">${initials(name)}</div>`,
  });
}

function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function MapView() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Map<number, L.Marker>>(new Map());
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
    mapRef.current?.flyTo([v.lat, v.lng], 15, { duration: 0.8 });
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { center: ZURICH, zoom: 12 });
    mapRef.current = map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: "© OpenStreetMap · © CARTO",
    }).addTo(map);

    setReady(true);
    [50, 250, 600, 1200].forEach((ms) =>
      window.setTimeout(() => map.invalidateSize(), ms),
    );
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const keep = new Set(visible.map((x) => x.i));
    for (const [i, m] of markers.current) {
      if (!keep.has(i)) {
        m.remove();
        markers.current.delete(i);
      }
    }
    for (const { v, i } of visible) {
      if (markers.current.has(i)) continue;
      const m = L.marker([v.lat, v.lng], { icon: markerIcon(v.sport, v.name, false) })
        .addTo(map)
        .on("click", () => focus(i));
      markers.current.set(i, m);
    }
  }, [visible, ready, focus]);

  useEffect(() => {
    for (const [i, m] of markers.current) {
      const v = VENUES[i];
      m.setIcon(markerIcon(v.sport, v.name, i === selected));
      m.setZIndexOffset(i === selected ? 1000 : 0);
    }
  }, [selected, visible]);

  const sel = selected != null ? VENUES[selected] : null;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-white text-neutral-900">
      {/* Sidebar */}
      <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="shrink-0 space-y-3 border-b border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <PinIcon className="h-5 w-5 text-matchup" />
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
        <div ref={mapEl} className="absolute inset-0 z-0" />

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
    </div>
  );
}
