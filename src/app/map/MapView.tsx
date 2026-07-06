"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase";
import {
  type Venue,
  VENUE_SELECT,
  SPORT_COLOR,
  SPORT_LABEL,
  CAT_LABEL,
  initials,
  primarySport,
} from "@/lib/venuesDb";

const ZURICH: [number, number] = [47.3769, 8.5417];

function markerIcon(v: Venue, active: boolean): L.DivIcon {
  const color = SPORT_COLOR[primarySport(v)] ?? SPORT_COLOR.tennis;
  const shadow = active
    ? "box-shadow:0 0 0 4px rgba(75,59,243,.30),0 6px 16px rgba(0,0,0,.28);"
    : "box-shadow:0 4px 12px rgba(0,0,0,.18);";
  const scale = active ? "transform:scale(1.22);" : "";
  const inner = v.logo_url
    ? `<img src="${v.logo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<span style="font-weight:800;font-size:11px;color:#111;">${initials(v.name)}</span>`;
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;border:3px solid ${color};${shadow}${scale}transition:transform .15s;">${inner}</div>`,
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
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const [ready, setReady] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("venues")
      .select(VENUE_SELECT)
      .order("name")
      .then(({ data }) => setVenues((data as Venue[]) ?? []));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return venues.filter((v) => {
      if (sportFilter && !v.sports.includes(sportFilter)) return false;
      if (catFilter && v.category !== catFilter) return false;
      if (q && !v.name.toLowerCase().includes(q) && !(v.city ?? "").toLowerCase().includes(q))
        return false;
      return v.lat != null && v.lng != null;
    });
  }, [venues, query, sportFilter, catFilter]);

  const focus = useCallback((v: Venue) => {
    setSelectedId(v.id);
    if (v.lat != null && v.lng != null)
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
    const keep = new Set(visible.map((v) => v.id));
    for (const [id, m] of markers.current) {
      if (!keep.has(id)) {
        m.remove();
        markers.current.delete(id);
      }
    }
    for (const v of visible) {
      if (markers.current.has(v.id)) continue;
      const m = L.marker([v.lat!, v.lng!], { icon: markerIcon(v, false) })
        .addTo(map)
        .on("click", () => focus(v));
      markers.current.set(v.id, m);
    }
  }, [visible, ready, focus]);

  useEffect(() => {
    for (const [id, m] of markers.current) {
      const v = visible.find((x) => x.id === id);
      if (!v) continue;
      m.setIcon(markerIcon(v, id === selectedId));
      m.setZIndexOffset(id === selectedId ? 1000 : 0);
    }
  }, [selectedId, visible]);

  const sel = venues.find((v) => v.id === selectedId) ?? null;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-white text-neutral-900">
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
            {[null, "tennis", "padel", "pickleball"].map((s) => (
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
            {[null, "club", "public", "private", "hotel"].map((c) => (
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
          {visible.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => focus(v)}
              className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                selectedId === v.id ? "bg-matchup/5" : ""
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-extrabold text-neutral-900 shadow-sm"
                style={{ border: `2.5px solid ${SPORT_COLOR[primarySport(v)]}` }}
              >
                {v.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(v.name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{v.name}</span>
                <span className="block text-xs text-neutral-400">
                  {v.sports.map((s) => SPORT_LABEL[s] ?? s).join(", ")} · {CAT_LABEL[v.category] ?? v.category}
                  {v.city ? ` · ${v.city}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="relative flex-1 bg-neutral-100">
        <div ref={mapEl} className="absolute inset-0 z-0" />

        {sel && (
          <div className="absolute bottom-4 left-4 right-4 z-[500] mx-auto max-w-md rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl ring-1 ring-neutral-200">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
              aria-label="Schliessen"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-extrabold text-neutral-900 shadow-sm"
                style={{ border: `3px solid ${SPORT_COLOR[primarySport(sel)]}` }}
              >
                {sel.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sel.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(sel.name)
                )}
              </span>
              <div className="min-w-0">
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: SPORT_COLOR[primarySport(sel)], color: "#fff" }}
                >
                  {sel.sports.map((s) => SPORT_LABEL[s] ?? s).join(" · ")}
                </span>
                <h2 className="mt-1 truncate text-lg font-bold tracking-tight">{sel.name}</h2>
                <p className="text-xs text-neutral-500">
                  {CAT_LABEL[sel.category] ?? sel.category}
                  {sel.city ? ` · ${sel.city}` : ""}
                </p>
              </div>
            </div>
            <a
              href={`/map/${sel.slug}`}
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
