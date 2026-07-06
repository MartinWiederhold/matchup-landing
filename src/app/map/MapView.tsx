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
  WEEKDAYS,
  initials,
  primarySport,
} from "@/lib/venuesDb";

const ZURICH: [number, number] = [47.3769, 8.5417];
// Ab dieser Zoomstufe (oder weiter draussen) werden Clubs zu Städte-Clustern zusammengefasst
const CLUSTER_ZOOM = 9;

// Vororte/Agglomeration werden ihrer Hauptstadt zugeordnet, damit es beim Rauszoomen
// EINE saubere Städte-Bubble gibt (Zürich, Bern, Basel …) – nicht viele Vorort-Punkte.
const CITY_HUB: Record<string, string> = {
  Zürich: "Zürich", Schlieren: "Zürich", Bassersdorf: "Zürich", Wallisellen: "Zürich",
  Greifensee: "Zürich", "Wangen bei Dübendorf": "Zürich", Dübendorf: "Zürich",
  Küsnacht: "Zürich", Zumikon: "Zürich", Dielsdorf: "Zürich", Opfikon: "Zürich", Rüti: "Zürich",
};
// Stadt → Bild (self-hosted). Fallback: lila Kreis mit Zahl.
const CITY_IMAGE: Record<string, string> = {
  Zürich: "/map-cities/zuerich.jpg", Bern: "/map-cities/bern.jpg", Basel: "/map-cities/basel.jpg",
  Genf: "/map-cities/genf.jpg", "Genève": "/map-cities/genf.jpg", Lausanne: "/map-cities/lausanne.jpg",
  Luzern: "/map-cities/luzern.jpg", "St. Gallen": "/map-cities/st-gallen.jpg",
  Winterthur: "/map-cities/winterthur.jpg", Lugano: "/map-cities/lugano.jpg",
};
const hubFor = (city: string | null) => (city && CITY_HUB[city]) || city || "Übrige";

const AMENITY_LABEL: Record<string, string> = {
  restaurant: "Restaurant / Bar",
  showers: "Duschen",
  parking: "Parkplatz",
  proshop: "Pro-Shop",
  ballmachine: "Ballmaschine",
  coaching: "Trainer / Schule",
  wallball: "Trainingswand",
  transit: "ÖV-Anbindung",
};

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
    html: `<div class="mu-pop" style="width:34px;height:34px;border-radius:9999px;background:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;border:3px solid ${color};${shadow}${scale}transition:transform .15s;">${inner}</div>`,
  });
}

function clusterIcon(city: string, count: number): L.DivIcon {
  const size = count >= 20 ? 62 : count >= 5 ? 54 : 46;
  const img = CITY_IMAGE[city];
  const inner = img
    ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="width:100%;height:100%;background:#4b3bf3;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${count >= 100 ? 13 : 15}px;">${count}</div>`;
  const badge = img
    ? `<div style="position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;padding:0 5px;border-radius:9999px;background:#4b3bf3;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">${count}</div>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="mu-pop" style="display:flex;flex-direction:column;align-items:center;transform:translateY(-10px);">
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="width:100%;height:100%;border-radius:9999px;overflow:hidden;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.32);">${inner}</div>
        ${badge}
      </div>
      <span style="margin-top:6px;background:rgba(17,17,17,.82);color:#fff;font-size:10px;font-weight:700;letter-spacing:.03em;padding:2px 8px;border-radius:9999px;white-space:nowrap;text-transform:uppercase;">${city}</span>
    </div>`,
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

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function NavIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

export default function MapView() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(12);

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
    const map = mapRef.current;
    if (!map || v.lat == null || v.lng == null) return;
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;
    map.flyTo([v.lat, v.lng], 15, { duration: 0.7 });
    // Mobil: Karte nach oben schieben, damit der Marker über dem Bottom-Sheet sichtbar bleibt
    if (mobile) {
      map.once("moveend", () => {
        map.panBy([0, Math.round(map.getSize().y * 0.3)], { animate: true, duration: 0.35 });
      });
    }
  }, []);

  // Weiche Einblend-Animation für Marker & Cluster
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent =
      "@keyframes muPop{0%{transform:scale(.4);opacity:0}62%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}" +
      ".mu-pop{animation:muPop .4s cubic-bezier(.34,1.56,.64,1) both}" +
      "@keyframes muSheet{0%{transform:translateY(100%)}100%{transform:translateY(0)}}" +
      ".mu-sheet{animation:muSheet .34s cubic-bezier(.22,1,.36,1) both}" +
      // moderne Zoom-Buttons unten rechts
      ".leaflet-control-zoom{border:none!important;border-radius:16px!important;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.16)!important;margin:0 14px 20px 0!important}" +
      ".leaflet-control-zoom a{width:44px!important;height:44px!important;line-height:44px!important;font-size:22px!important;font-weight:500!important;color:#1f2937!important;background:#fff!important;border:none!important;transition:background .15s}" +
      ".leaflet-control-zoom a:first-child{border-bottom:1px solid #f0f0f0!important}" +
      ".leaflet-control-zoom a:hover{background:#f6f6f7!important;color:#4b3bf3!important}" +
      // dezente Attribution ohne Flagge
      ".leaflet-control-attribution{background:rgba(255,255,255,.65)!important;backdrop-filter:blur(4px);font-size:9px!important;color:#9ca3af!important;padding:1px 6px!important;border-radius:8px 0 0 0!important}" +
      ".leaflet-control-attribution a{color:#9ca3af!important;text-decoration:none}";
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { center: ZURICH, zoom: 12, zoomControl: false });
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: "© OpenStreetMap · CARTO",
    }).addTo(map);
    map.attributionControl.setPrefix(false); // entfernt "Leaflet" + Ukraine-Flagge
    L.control.zoom({ position: "bottomright" }).addTo(map);
    setZoom(map.getZoom());
    map.on("zoomend", () => setZoom(map.getZoom()));
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
      layerRef.current = null;
    };
  }, []);

  // Marker aufbauen: ab weit rausgezoomt nach Städten clustern, sonst einzeln
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !ready) return;
    layer.clearLayers();

    if (zoom <= CLUSTER_ZOOM) {
      const groups = new Map<string, Venue[]>();
      for (const v of visible) {
        const c = hubFor(v.city);
        (groups.get(c) ?? groups.set(c, []).get(c)!).push(v);
      }
      for (const [city, vs] of groups) {
        const lat = vs.reduce((s, v) => s + v.lat!, 0) / vs.length;
        const lng = vs.reduce((s, v) => s + v.lng!, 0) / vs.length;
        L.marker([lat, lng], { icon: clusterIcon(city, vs.length) })
          .addTo(layer)
          .on("click", () => map.flyTo([lat, lng], 13, { duration: 0.8 }));
      }
    } else {
      for (const v of visible) {
        L.marker([v.lat!, v.lng!], { icon: markerIcon(v, v.id === selectedId) })
          .addTo(layer)
          .on("click", () => focus(v))
          .setZIndexOffset(v.id === selectedId ? 1000 : 0);
      }
    }
  }, [visible, ready, zoom, selectedId, focus]);

  const sel = venues.find((v) => v.id === selectedId) ?? null;

  function backToList() {
    setSelectedId(null);
    // Leicht rauszoomen, damit man direkt wieder mehrere Clubs der Umgebung sieht
    const map = mapRef.current;
    if (map && map.getZoom() > 13) map.flyTo(map.getCenter(), 13, { duration: 0.5 });
  }

  const sportChips = (mobile: boolean) => (
    <>
      {[null, "tennis", "padel", "pickleball"].map((s) => {
        const active = sportFilter === s;
        return (
          <button
            key={s ?? "all"}
            type="button"
            onClick={() => setSportFilter(s)}
            className={`shrink-0 whitespace-nowrap rounded-full font-semibold transition-colors ${
              mobile ? "px-3.5 py-1.5 text-sm" : "px-3 py-1 text-xs"
            } ${
              active
                ? "bg-matchup text-white shadow-sm"
                : mobile
                  ? "bg-white/95 text-neutral-700 shadow-sm ring-1 ring-neutral-300 backdrop-blur"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {s ? SPORT_LABEL[s] : "Alle"}
          </button>
        );
      })}
    </>
  );
  const catChips = (mobile: boolean) => (
    <>
      {[null, "club", "public", "private", "hotel"].map((c) => {
        const active = catFilter === c;
        return (
          <button
            key={c ?? "allc"}
            type="button"
            onClick={() => setCatFilter(c)}
            className={`shrink-0 whitespace-nowrap rounded-full font-medium transition-colors ${
              mobile ? "px-3.5 py-1.5 text-sm" : "px-3 py-1 text-[11px]"
            } ${
              active
                ? "bg-neutral-900 text-white shadow-sm"
                : mobile
                  ? "bg-white/95 text-neutral-600 shadow-sm ring-1 ring-neutral-300 backdrop-blur"
                  : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {c ? CAT_LABEL[c] : "Alle Typen"}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-white text-neutral-900">
      {/* Desktop: Sidebar (Liste bzw. Detail) */}
      <aside className="hidden w-full max-w-sm shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        {sel ? (
          <VenueDetail venue={sel} onBack={backToList} />
        ) : (
          <>
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
              <div className="flex flex-wrap gap-1.5">{sportChips(false)}</div>
              <div className="flex flex-wrap gap-1.5">{catChips(false)}</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {visible.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => focus(v)}
                  className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
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
              {visible.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-neutral-400">Keine Treffer.</p>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Karte (mobil Vollbild, desktop rechts) */}
      <div className="relative flex-1 bg-neutral-100">
        <div ref={mapEl} className="absolute inset-0 z-0" />

        {/* Mobile: Filterleiste oben über der Karte */}
        {!sel && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] space-y-2 p-3 md:hidden">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-4 shadow-lg ring-1 ring-neutral-200 backdrop-blur">
              <PinIcon className="h-4 w-4 shrink-0 text-matchup" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Club oder Ort suchen…"
                className="h-11 w-full bg-transparent text-sm outline-none"
              />
              <span className="shrink-0 text-xs font-semibold text-neutral-400">{visible.length}</span>
            </div>
            <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sportChips(true)}
              <span className="shrink-0 self-center text-neutral-300">·</span>
              {catChips(true)}
            </div>
          </div>
        )}

        {/* Mobile: Detail als Bottom-Sheet, Karte bleibt oben sichtbar */}
        {sel && (
          <div className="mu-sheet absolute inset-x-0 bottom-0 z-[600] h-[66%] overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 md:hidden">
            <VenueDetail venue={sel} onBack={backToList} sheet />
          </div>
        )}
      </div>
    </div>
  );
}

function VenueDetail({
  venue: v,
  onBack,
  sheet = false,
}: {
  venue: Venue;
  onBack: () => void;
  sheet?: boolean;
}) {
  const color = SPORT_COLOR[primarySport(v)] ?? SPORT_COLOR.tennis;

  const facts: { label: string; value: string }[] = [];
  const courts = (v.courts_indoor ?? 0) + (v.courts_outdoor ?? 0) || null;
  if (courts)
    facts.push({
      label: "Plätze",
      value: [
        v.courts_indoor ? `${v.courts_indoor} Indoor` : "",
        v.courts_outdoor ? `${v.courts_outdoor} Outdoor` : "",
      ].filter(Boolean).join(" · "),
    });
  if (v.surfaces?.length) facts.push({ label: "Belag", value: v.surfaces.join(", ") });
  if (v.floodlight != null) facts.push({ label: "Flutlicht", value: v.floodlight ? "Ja" : "Nein" });
  if (v.member_count) facts.push({ label: "Mitglieder", value: String(v.member_count) });
  if (v.founded) facts.push({ label: "Gegründet", value: String(v.founded) });
  if (v.guest_access != null)
    facts.push({ label: "Gäste", value: v.guest_access ? "Willkommen" : "Nur Mitglieder" });
  if (v.guest_fee) facts.push({ label: "Gastgebühr", value: v.guest_fee });
  if (v.court_price) facts.push({ label: "Platzmiete", value: v.court_price });
  if (v.membership_fee) facts.push({ label: "Mitgliedschaft", value: v.membership_fee });
  if (v.season) facts.push({ label: "Saison", value: v.season });

  const hasHours = v.opening_hours && Object.keys(v.opening_hours).length > 0;

  return (
    <div className="flex h-full flex-col">
      {sheet && (
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
        </div>
      )}
      <div className="shrink-0 border-b border-neutral-200 p-4 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-matchup hover:underline"
        >
          {sheet ? "✕ Schliessen" : "← Alle Clubs"}
        </button>
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-base font-extrabold text-neutral-900"
            style={{ border: `3px solid ${color}` }}
          >
            {v.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(v.name)
            )}
          </span>
          <div className="min-w-0">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: color }}
            >
              {v.sports.map((s) => SPORT_LABEL[s] ?? s).join(" · ")}
            </span>
            <h2 className="mt-1 text-lg font-bold leading-tight tracking-tight">{v.name}</h2>
            <p className="text-xs text-neutral-500">
              {CAT_LABEL[v.category] ?? v.category}
              {v.city ? ` · ${v.city}` : ""}
              {v.verified ? " · ✓" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {(v.booking_url || v.website || v.phone || (v.lat != null && v.lng != null)) && (
          <div className="space-y-2">
            {(v.booking_url || v.website) && (
              <div className="flex gap-2">
                {v.booking_url && (
                  <a
                    href={v.booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center rounded-full bg-matchup px-3 py-3 text-sm font-bold text-white hover:bg-matchup-hover"
                  >
                    Platz buchen
                  </a>
                )}
                {v.website && (
                  <a
                    href={v.website}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex flex-1 items-center justify-center rounded-full px-3 py-3 text-sm ${
                      v.booking_url
                        ? "border border-neutral-300 font-semibold text-neutral-700 hover:bg-neutral-50"
                        : "bg-matchup font-bold text-white hover:bg-matchup-hover"
                    }`}
                  >
                    Website öffnen
                  </a>
                )}
              </div>
            )}
            {(v.phone || (v.lat != null && v.lng != null)) && (
              <div className="flex gap-2">
                {v.phone && (
                  <a
                    href={`tel:${v.phone}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    <PhoneIcon className="h-4 w-4 text-matchup" />
                    Anrufen
                  </a>
                )}
                {v.lat != null && v.lng != null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    <NavIcon className="h-4 w-4 text-matchup" />
                    Route
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {v.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.cover_url} alt="" className="h-36 w-full rounded-xl object-cover" />
        )}

        {v.description && (
          <p className="text-sm leading-relaxed text-neutral-600">{v.description}</p>
        )}

        {v.address && (
          <p className="text-sm text-neutral-500">
            📍 {v.address}
            {v.postal_code ? `, ${v.postal_code}` : ""} {v.city}
          </p>
        )}

        {facts.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            {facts.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between border-b border-neutral-100 px-3 py-2.5 text-sm last:border-0"
              >
                <span className="text-neutral-500">{f.label}</span>
                <span className="text-right font-semibold">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {hasHours && (
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Öffnungszeiten
            </h3>
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              {WEEKDAYS.map((d) => (
                <div
                  key={d.key}
                  className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 text-sm last:border-0"
                >
                  <span className="text-neutral-500">{d.label}</span>
                  <span className="font-medium">{v.opening_hours?.[d.key] || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {v.amenities?.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Ausstattung
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {v.amenities.map((a) => (
                <span key={a} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  {AMENITY_LABEL[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
