"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VENUES, type Sport, type VenueCategory, type Venue } from "@/lib/mapVenues";

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

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: visible.map(({ v, i }) => ({
        type: "Feature" as const,
        properties: { i, sport: v.sport, name: v.name },
        geometry: { type: "Point" as const, coordinates: [v.lng, v.lat] },
      })),
    }),
    [visible],
  );

  // Karte initialisieren
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [10, 30],
      zoom: 1.6,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      try {
        map.setProjection({ type: "globe" });
      } catch {
        /* ältere Version → flach */
      }
      map.addSource("venues", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 13,
      });
      // Cluster-Kreise
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "venues",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#4b3bf3",
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 30, 30],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "venues",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13,
          "text-font": ["Noto Sans Bold"],
        },
        paint: { "text-color": "#ffffff" },
      });
      // Einzel-Punkte (Farbe nach Sport)
      map.addLayer({
        id: "points",
        type: "circle",
        source: "venues",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "sport"],
            "padel",
            SPORT_COLOR.padel,
            "pickleball",
            SPORT_COLOR.pickleball,
            SPORT_COLOR.tennis,
          ],
          "circle-radius": 8,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "clusters", (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        const cid = f.properties?.cluster_id;
        const src = map.getSource("venues") as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(cid).then((z) => {
          map.easeTo({
            center: (f.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: z,
          });
        });
      });
      map.on("click", "points", (e) => {
        const idx = e.features?.[0]?.properties?.i;
        if (typeof idx === "number") setSelected(idx);
      });
      const cursor = (v: string) => () => (map.getCanvas().style.cursor = v);
      map.on("mouseenter", "clusters", cursor("pointer"));
      map.on("mouseleave", "clusters", cursor(""));
      map.on("mouseenter", "points", cursor("pointer"));
      map.on("mouseleave", "points", cursor(""));

      setReady(true);
      // Intro: sanft nach Zürich fliegen
      window.setTimeout(() => {
        map.flyTo({ center: ZURICH, zoom: 11.5, speed: 0.8 });
      }, 700);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quelle bei Filter-Änderung aktualisieren
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("venues") as maplibregl.GeoJSONSource | undefined;
    src?.setData(geojson);
  }, [geojson, ready]);

  function focus(idx: number) {
    setSelected(idx);
    const v = VENUES[idx];
    mapRef.current?.flyTo({ center: [v.lng, v.lat], zoom: 15, speed: 1 });
  }

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
                className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SPORT_COLOR[v.sport] }}
              />
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

        {/* Detail-Panel */}
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
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: SPORT_COLOR[sel.sport], color: "#fff" }}
            >
              {SPORT_LABEL[sel.sport]}
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight">{sel.name}</h2>
            <p className="mt-1 text-sm text-white/60">
              {CAT_LABEL[sel.category]}
              {sel.city ? ` · ${sel.city}` : ""}
            </p>
            <a
              href={sel.website || "#"}
              target={sel.website ? "_blank" : undefined}
              rel="noreferrer"
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold ${
                sel.website
                  ? "bg-matchup text-white hover:bg-matchup-hover"
                  : "cursor-default bg-white/10 text-white/40"
              }`}
            >
              {sel.website ? "Vollständiges Profil →" : "Profil folgt bald"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
