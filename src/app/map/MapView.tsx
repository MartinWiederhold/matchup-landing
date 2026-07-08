"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import SeasonPlanner from "./SeasonPlanner";
import {
  TOURNAMENTS,
  TIER_META,
  HOME_BASES,
  byDate,
  autoPlan,
  bestStartBase,
  type Tournament,
  type HomeBase,
} from "@/lib/tournaments";
import {
  loadProfile,
  saveProfile,
  eligibility,
  ELIG_COLOR,
  EMPTY_PROFILE,
  type PlayerProfile,
} from "@/lib/player";

const ZURICH: [number, number] = [47.3769, 8.5417];
// Ab dieser Zoomstufe (oder weiter draussen) werden Clubs zu Städte-Clustern zusammengefasst
const CLUSTER_ZOOM = 9;

// Vororte/Agglomeration werden ihrer Hauptstadt zugeordnet, damit es beim Rauszoomen
// EINE saubere Städte-Bubble gibt (Zürich, Bern, Basel …) – nicht viele Vorort-Punkte.
const CITY_HUB: Record<string, string> = {
  // Agglomeration Zürich
  Zürich: "Zürich", Schlieren: "Zürich", Bassersdorf: "Zürich", Wallisellen: "Zürich",
  Greifensee: "Zürich", "Wangen bei Dübendorf": "Zürich", Dübendorf: "Zürich",
  Küsnacht: "Zürich", Zumikon: "Zürich", Dielsdorf: "Zürich", Opfikon: "Zürich", Rüti: "Zürich",
  // Agglomeration Luzern
  Luzern: "Luzern", Kriens: "Luzern", Emmen: "Luzern", Emmenbrücke: "Luzern", Ebikon: "Luzern",
  Horw: "Luzern", Adligenswil: "Luzern", Meggen: "Luzern", Udligenswil: "Luzern", Root: "Luzern",
  Ruswil: "Luzern", Rothenburg: "Luzern", Dierikon: "Luzern", Hochdorf: "Luzern", Meierskappel: "Luzern",
  // Agglomeration Zug
  Zug: "Zug", Baar: "Zug", Cham: "Zug", Steinhausen: "Zug", Hünenberg: "Zug",
  "Risch-Rotkreuz": "Zug", Rotkreuz: "Zug", Unterägeri: "Zug", Oberägeri: "Zug", Menzingen: "Zug",
  // Agglomeration Bern
  Bern: "Bern", Köniz: "Bern", Ostermundigen: "Bern", Muri: "Bern", "Muri bei Bern": "Bern",
  Ittigen: "Bern", Zollikofen: "Bern", Bümpliz: "Bern", Wabern: "Bern", Bolligen: "Bern",
  Worb: "Bern", Gümligen: "Bern", Liebefeld: "Bern", "Wohlen bei Bern": "Bern",
  Münchenbuchsee: "Bern", Herrenschwanden: "Bern", Kehrsatz: "Bern", Worblaufen: "Bern",
  // Agglomeration Basel
  Basel: "Basel", Riehen: "Basel", Birsfelden: "Basel", Muttenz: "Basel", Allschwil: "Basel",
  Binningen: "Basel", Bottmingen: "Basel", Münchenstein: "Basel", Reinach: "Basel", Pratteln: "Basel",
  Oberwil: "Basel", Arlesheim: "Basel",
  // Winterthur
  Winterthur: "Winterthur", Wülflingen: "Winterthur", Seen: "Winterthur", Töss: "Winterthur",
  Oberwinterthur: "Winterthur", Elgg: "Winterthur", Wiesendangen: "Winterthur", Pfungen: "Winterthur",
  Elsau: "Winterthur",
  // St. Gallen
  "St. Gallen": "St. Gallen", Gossau: "St. Gallen", Herisau: "St. Gallen", Wittenbach: "St. Gallen",
  Abtwil: "St. Gallen", Gaiserwald: "St. Gallen", Rorschach: "St. Gallen", "St.Gallen": "St. Gallen",
  Tübach: "St. Gallen", Goldach: "St. Gallen", Rorschacherberg: "St. Gallen",
  // Agglomeration Genf
  "Genève": "Genève", Genf: "Genève", Carouge: "Genève", Lancy: "Genève", Meyrin: "Genève",
  Vernier: "Genève", Onex: "Genève", "Grand-Saconnex": "Genève", "Le Grand-Saconnex": "Genève",
  "Chêne-Bougeries": "Genève", Thônex: "Genève", "Plan-les-Ouates": "Genève", Versoix: "Genève",
  Cologny: "Genève", Veyrier: "Genève", "Chêne-Bourg": "Genève", "Vésenaz": "Genève",
  Vessy: "Genève", Bellevue: "Genève", "Grand-Lancy": "Genève", "Petit-Lancy": "Genève",
  "Pregny-Chambésy": "Genève", Bernex: "Genève",
  // Agglomeration Lausanne
  Lausanne: "Lausanne", Renens: "Lausanne", Pully: "Lausanne", Prilly: "Lausanne", Ecublens: "Lausanne",
  Crissier: "Lausanne", "Le Mont-sur-Lausanne": "Lausanne", "Épalinges": "Lausanne", Epalinges: "Lausanne",
  "Chavannes-près-Renens": "Lausanne", Lutry: "Lausanne", Morges: "Lausanne", "Saint-Sulpice": "Lausanne",
  "Romanel-sur-Lausanne": "Lausanne", "La Croix-sur-Lutry": "Lausanne",
  // Agglomeration Lugano
  Lugano: "Lugano", Massagno: "Lugano", Paradiso: "Lugano", Agno: "Lugano", Bioggio: "Lugano",
  Manno: "Lugano", Savosa: "Lugano", Comano: "Lugano", Canobbio: "Lugano", Caslano: "Lugano",
  Pregassona: "Lugano", Viganello: "Lugano", Tesserete: "Lugano", Cadempino: "Lugano", Grancia: "Lugano",
  // New York (Metro inkl. NJ-Waterfront)
  "New York": "New York", Brooklyn: "New York", Queens: "New York", Bronx: "New York",
  "Staten Island": "New York", "Jersey City": "New York", Hoboken: "New York",
  // Portland (OR) Metro
  Portland: "Portland", Beaverton: "Portland", Tualatin: "Portland", Vancouver: "Portland",
  Gresham: "Portland", "Lake Oswego": "Portland", Tigard: "Portland", Hillsboro: "Portland",
  // Madrid Metro
  Madrid: "Madrid", "San Sebastián de los Reyes": "Madrid", Alcobendas: "Madrid",
  "Rivas-Vaciamadrid": "Madrid", "Alcorcón": "Madrid", "Las Rozas de Madrid": "Madrid",
  "Pozuelo de Alarcón": "Madrid", Algete: "Madrid", Getafe: "Madrid", Majadahonda: "Madrid",
  // Barcelona Metro
  Barcelona: "Barcelona", "L'Hospitalet de Llobregat": "Barcelona", "Sant Cugat del Vallès": "Barcelona",
  Terrassa: "Barcelona", Sabadell: "Barcelona", "Gavà": "Barcelona", "Cornellà de Llobregat": "Barcelona",
  "El Prat de Llobregat": "Barcelona", Badalona: "Barcelona", "Esplugues de Llobregat": "Barcelona",
  Viladecans: "Barcelona", "Sant Boi de Llobregat": "Barcelona", Castelldefels: "Barcelona",
  // Palma / Mallorca
  Palma: "Palma", Manacor: "Palma", "Calvià": "Palma", "Marratxí": "Palma", "Alcúdia": "Palma", Llucmajor: "Palma",
  // Milano Metro
  Milano: "Milano", Buccinasco: "Milano", Assago: "Milano", Segrate: "Milano", "Paderno Dugnano": "Milano",
  Basiglio: "Milano", "Novate Milanese": "Milano", Cornaredo: "Milano", Monza: "Milano",
  "Sesto San Giovanni": "Milano", "San Donato Milanese": "Milano", "Cologno Monzese": "Milano",
  "Cinisello Balsamo": "Milano", Rho: "Milano", "Bovisio Masciago": "Milano", Villasanta: "Milano",
  // Roma
  Roma: "Roma",
  // London (Greater London bereits als city="London" normiert)
  London: "London",
  // Paris Metro
  Paris: "Paris", "Boulogne-Billancourt": "Paris", "Neuilly-sur-Seine": "Paris", "Sucy-en-Brie": "Paris",
  "Saint-Denis": "Paris", Montreuil: "Paris", "Issy-les-Moulineaux": "Paris", "Levallois-Perret": "Paris",
  // Berlin Metro
  Berlin: "Berlin", Potsdam: "Berlin",
  // Amsterdam Metro
  Amsterdam: "Amsterdam", Amstelveen: "Amsterdam",
  // Dubai (Stadtteile als city="Dubai" normiert)
  Dubai: "Dubai",
  // Miami Metro
  Miami: "Miami", "Miami Beach": "Miami", "Coral Gables": "Miami", Doral: "Miami", Aventura: "Miami",
  "Key Biscayne": "Miami", "North Miami": "Miami", Kendall: "Miami", Hialeah: "Miami",
};
// Stadt → Bild (self-hosted). Fallback: lila Kreis mit Zahl.
const CITY_IMAGE: Record<string, string> = {
  Zürich: "/map-cities/zuerich.jpg", Bern: "/map-cities/bern.jpg", Basel: "/map-cities/basel.jpg",
  Genf: "/map-cities/genf.jpg", "Genève": "/map-cities/genf.jpg", Lausanne: "/map-cities/lausanne.jpg",
  Luzern: "/map-cities/luzern.jpg", Zug: "/map-cities/zug.jpg", "St. Gallen": "/map-cities/st-gallen.jpg",
  Winterthur: "/map-cities/winterthur.jpg", Lugano: "/map-cities/lugano.jpg",
  "New York": "/map-cities/new-york.jpg", Portland: "/map-cities/portland.jpg",
  Madrid: "/map-cities/madrid.jpg", Barcelona: "/map-cities/barcelona.jpg", Palma: "/map-cities/palma.jpg",
  Milano: "/map-cities/milano.jpg", Roma: "/map-cities/roma.jpg",
  London: "/map-cities/london.jpg", Paris: "/map-cities/paris.jpg", Berlin: "/map-cities/berlin.jpg",
  Amsterdam: "/map-cities/amsterdam.jpg", Dubai: "/map-cities/dubai.jpg", Miami: "/map-cities/miami.jpg",
  Tokyo: "/map-cities/tokyo.jpg", Sydney: "/map-cities/sydney.jpg", Melbourne: "/map-cities/melbourne.jpg",
  "São Paulo": "/map-cities/sao-paulo.jpg", "Rio de Janeiro": "/map-cities/rio.jpg",
  "Buenos Aires": "/map-cities/buenos-aires.jpg", "Mexico City": "/map-cities/mexico-city.jpg",
  Toronto: "/map-cities/toronto.jpg", Stockholm: "/map-cities/stockholm.jpg", Lisbon: "/map-cities/lisbon.jpg",
  Vienna: "/map-cities/vienna.jpg", Brussels: "/map-cities/brussels.jpg", Singapore: "/map-cities/singapore.jpg",
  Doha: "/map-cities/doha.jpg", "Cape Town": "/map-cities/cape-town.jpg",
  Bali: "/map-cities/bali.jpg", Bangkok: "/map-cities/bangkok.jpg", "Kuala Lumpur": "/map-cities/kuala-lumpur.jpg",
  Riyadh: "/map-cities/riyadh.jpg", Cairo: "/map-cities/cairo.jpg", Helsinki: "/map-cities/helsinki.jpg",
  Oslo: "/map-cities/oslo.jpg", Copenhagen: "/map-cities/copenhagen.jpg", "Bogotá": "/map-cities/bogota.jpg",
  Santiago: "/map-cities/santiago.jpg", Montevideo: "/map-cities/montevideo.jpg", Athens: "/map-cities/athens.jpg",
  Istanbul: "/map-cities/istanbul.jpg", Mumbai: "/map-cities/mumbai.jpg", Dublin: "/map-cities/dublin.jpg",
  "München": "/map-cities/munich.jpg", Hamburg: "/map-cities/hamburg.jpg", "Köln": "/map-cities/cologne.jpg",
  Frankfurt: "/map-cities/frankfurt.jpg", Stuttgart: "/map-cities/stuttgart.jpg", "Düsseldorf": "/map-cities/dusseldorf.jpg",
  Leipzig: "/map-cities/leipzig.jpg", "Nürnberg": "/map-cities/nuremberg.jpg",
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
    ? `<img src="${v.logo_url}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<span style="font-weight:800;font-size:11px;color:#111;">${initials(v.name)}</span>`;
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;border:3px solid ${color};${shadow}${scale}transition:transform .15s;">${inner}</div>`,
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

// Startpunkt der Saison (grün, mit START-Label)
function startMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [40, 44],
    iconAnchor: [20, 22],
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px)">
      <div style="width:34px;height:34px;border-radius:9999px;background:#16a34a;border:3px solid #fff;box-shadow:0 5px 14px rgba(0,0,0,.32);display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:800;">⌂</div>
      <span style="margin-top:4px;background:#16a34a;color:#fff;font-size:9px;font-weight:800;letter-spacing:.06em;padding:1px 7px;border-radius:9999px;white-space:nowrap;">START</span>
    </div>`,
  });
}

// Turnier-Marker: nummeriert wenn im Plan, sonst Stern; eingefärbt nach Kategorie
function tourMarkerIcon(t: Tournament, order: number | null, active: boolean, color?: string): L.DivIcon {
  const c = color ?? TIER_META[t.tier].color;
  const size = order != null ? 32 : 24;
  const inner =
    order != null
      ? `<span style="color:#fff;font-weight:800;font-size:13px;">${order}</span>`
      : `<span style="color:#fff;font-size:12px;line-height:1;">★</span>`;
  const ring = active
    ? "box-shadow:0 0 0 4px rgba(75,59,243,.32),0 6px 14px rgba(0,0,0,.3);transform:scale(1.12);"
    : "box-shadow:0 3px 10px rgba(0,0,0,.28);";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${c};border:3px solid #fff;${ring}display:flex;align-items:center;justify-content:center;transition:transform .15s;">${inner}</div>`,
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
  const [moveTick, setMoveTick] = useState(0); // bumpt bei jedem Pan/Zoom-Ende → Viewport neu berechnen

  const [venues, setVenues] = useState<Venue[]>([]);
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Saison-planen-Tab (ATP/Challenger/ITF)
  const [tab, setTab] = useState<"discover" | "season">("discover");
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [startBase, setStartBase] = useState<HomeBase>(HOME_BASES[0]);
  const [budget, setBudget] = useState(15000);
  const [selTid, setSelTid] = useState<string | null>(null);
  const [tours, setTours] = useState<Tournament[]>(TOURNAMENTS); // DB > statischer Fallback
  const [profile, setProfile] = useState<PlayerProfile>(EMPTY_PROFILE);
  const [onlyEligible, setOnlyEligible] = useState(false);
  useEffect(() => setProfile(loadProfile()), []);
  useEffect(() => saveProfile(profile), [profile]);
  const hasRank = profile.atp != null || profile.wta != null || profile.itf != null;

  // Plan aus localStorage laden / speichern
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mu-season");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Array.isArray(s.planIds)) setPlanIds(s.planIds.filter((x: unknown) => typeof x === "string"));
      if (typeof s.budget === "number") setBudget(s.budget);
      if (s.startBase) {
        const b = HOME_BASES.find((h) => h.name === s.startBase);
        if (b) setStartBase(b);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("mu-season", JSON.stringify({ planIds, budget, startBase: startBase.name }));
    } catch {}
  }, [planIds, budget, startBase]);

  const togglePlan = useCallback(
    (id: string) => setPlanIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    [],
  );
  const focusTour = useCallback((t: Tournament) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([t.lat, t.lng], Math.max(map.getZoom(), 5), { duration: 0.7 });
  }, []);
  // Smart-Planer: günstigste Saison automatisch füllen / beste Startbasis wählen
  const smartFill = useCallback(() => {
    setSelTid(null);
    setPlanIds(autoPlan(tours, budget, startBase));
  }, [tours, budget, startBase]);
  const cheapestStart = useCallback(() => {
    const plan = planIds.map((id) => tours.find((t) => t.id === id)).filter(Boolean) as Tournament[];
    if (plan.length) setStartBase(bestStartBase(plan));
  }, [planIds, tours]);

  useEffect(() => {
    supabase
      .from("venues")
      .select(VENUE_SELECT)
      .order("name")
      .limit(3000) // sonst kappt PostgREST bei 1000 Zeilen → Anlagen fehlen
      .then(({ data }) => setVenues((data as Venue[]) ?? []));
  }, []);

  // Turnierkalender aus der DB (wird per Cron/Sync aus öffentlichen Quellen aktuell gehalten).
  // Fällt auf die eingebaute Liste zurück, falls die DB (noch) leer ist.
  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .eq("status", "active")
      .then(({ data }) => {
        if (!data || !data.length) return;
        setTours(
          data.map((r) => ({
            id: r.id as string,
            name: r.name as string,
            city: r.city as string,
            country: r.country as string,
            lat: r.lat as number,
            lng: r.lng as number,
            tier: r.tier as Tournament["tier"],
            surface: r.surface as Tournament["surface"],
            indoor: !!r.indoor,
            start: r.start_date as string,
            end: r.end_date as string,
            url: (r.url as string) ?? undefined,
            prize: (r.prize as number) ?? undefined,
          })),
        );
      });
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

  // Nur Marker im aktuell sichtbaren Kartenausschnitt rendern (Viewport-Culling).
  // Beim weiten Rauszoomen (Cluster-Modus) werden ohnehin nur ~Städte-Bubbles gebaut.
  const MARKER_CAP = 350;
  const inView = useMemo(() => {
    const map = mapRef.current;
    if (!map || !ready || zoom <= CLUSTER_ZOOM) return visible;
    const b = map.getBounds().pad(0.3);
    const s = b.getSouth(), n = b.getNorth(), w = b.getWest(), e = b.getEast();
    const out: Venue[] = [];
    for (const v of visible) {
      const la = v.lat as number, lo = v.lng as number;
      if (la >= s && la <= n && lo >= w && lo <= e) out.push(v);
    }
    return out.length > MARKER_CAP ? out.slice(0, MARKER_CAP) : out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, zoom, ready, moveTick]);

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
      // animierte Reiseroute (Flight-Path-Look)
      ".mu-route{stroke-dasharray:6 10;animation:muDash 1.1s linear infinite}@keyframes muDash{to{stroke-dashoffset:-16}}" +
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
    map.on("moveend", () => setMoveTick((t) => t + 1));
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
    if (!map || !layer || !ready || tab !== "discover") return;
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
      for (const v of inView) {
        L.marker([v.lat!, v.lng!], { icon: markerIcon(v, v.id === selectedId), keyboard: false })
          .addTo(layer)
          .on("click", () => focus(v))
          .setZIndexOffset(v.id === selectedId ? 1000 : 0);
      }
    }
  }, [visible, inView, ready, zoom, selectedId, focus, tab]);

  // Saison-Modus: Turnier-Marker + animierte Reiseroute vom Startpunkt durch alle Stops
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !ready || tab !== "season") return;
    layer.clearLayers();

    const plan = planIds
      .map((id) => tours.find((t) => t.id === id))
      .filter(Boolean)
      .sort(byDate as never) as Tournament[];

    const pts: [number, number][] = [
      [startBase.lat, startBase.lng],
      ...plan.map((t) => [t.lat, t.lng] as [number, number]),
    ];
    if (pts.length > 1) {
      L.polyline(pts, {
        className: "mu-route",
        color: "#4b3bf3",
        weight: 3,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);
    }

    L.marker([startBase.lat, startBase.lng], { icon: startMarkerIcon(), keyboard: false, zIndexOffset: 400 }).addTo(layer);

    for (const t of tours) {
      const order = plan.findIndex((p) => p.id === t.id);
      const inP = order >= 0;
      const status = hasRank ? eligibility(profile, t).status : null;
      if (onlyEligible && hasRank && !inP && status === "red") continue;
      const color = status ? ELIG_COLOR[status] : undefined;
      L.marker([t.lat, t.lng], {
        icon: tourMarkerIcon(t, inP ? order + 1 : null, t.id === selTid, color),
        keyboard: false,
        zIndexOffset: t.id === selTid ? 600 : inP ? 300 : 0,
      })
        .addTo(layer)
        .on("click", () => {
          setSelTid(t.id);
          map.flyTo([t.lat, t.lng], Math.max(map.getZoom(), 5), { duration: 0.6 });
        });
    }
  }, [ready, tab, planIds, startBase, selTid, tours, profile, hasRank, onlyEligible]);

  // Route beim Ändern des Plans/Startpunkts einpassen
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || tab !== "season") return;
    const plan = planIds.map((id) => tours.find((t) => t.id === id)).filter(Boolean) as Tournament[];
    const pts: [number, number][] = [
      [startBase.lat, startBase.lng],
      ...plan.map((t) => [t.lat, t.lng] as [number, number]),
    ];
    if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts).pad(0.25), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIds, startBase, tab, ready, tours]);

  const sel = venues.find((v) => v.id === selectedId) ?? null;

  // Liste nur mit den relevanten Orten füllen (Karte im Blick), nicht alle 1000+ DOM-Knoten rendern.
  // Bei aktiver Suche aber global zeigen, damit man auch ferne Treffer anklicken (und hinfliegen) kann.
  const listSource = query.trim() || zoom <= CLUSTER_ZOOM ? visible : inView;
  const listItems = listSource.slice(0, 80);
  const listMore = listSource.length - listItems.length;

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
        <div className="shrink-0 border-b border-neutral-200 p-3">
          <div className="flex rounded-full bg-neutral-100 p-1">
            <TabBtn active={tab === "discover"} onClick={() => setTab("discover")}>Entdecken</TabBtn>
            <TabBtn active={tab === "season"} onClick={() => setTab("season")}>Saison planen</TabBtn>
          </div>
        </div>
        {tab === "season" ? (
          <SeasonPlanner
            planIds={planIds}
            onTogglePlan={togglePlan}
            start={startBase}
            setStart={setStartBase}
            budget={budget}
            setBudget={setBudget}
            selTid={selTid}
            setSelTid={setSelTid}
            onFocus={focusTour}
            onSmartFill={smartFill}
            onCheapestStart={cheapestStart}
            tours={tours}
            profile={profile}
            setProfile={setProfile}
            onlyEligible={onlyEligible}
            setOnlyEligible={setOnlyEligible}
            venues={venues}
          />
        ) : sel ? (
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
              {listItems.map((v) => (
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
                      <img src={v.logo_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
              {listMore > 0 && (
                <p className="px-4 py-4 text-center text-xs text-neutral-400">
                  +{listMore} weitere · auf der Karte reinzoomen zum Eingrenzen
                </p>
              )}
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

        {/* Mobile: Tab-Umschalter + (nur Entdecken) Suche/Filter oben */}
        {!(tab === "discover" && sel) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[550] space-y-2 p-3 md:hidden">
            <div className="flex justify-center">
              <div className="pointer-events-auto flex rounded-full bg-white/95 p-1 shadow-lg ring-1 ring-neutral-200 backdrop-blur">
                <TabBtn small active={tab === "discover"} onClick={() => setTab("discover")}>Entdecken</TabBtn>
                <TabBtn small active={tab === "season"} onClick={() => setTab("season")}>Saison</TabBtn>
              </div>
            </div>
            {tab === "discover" && (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Mobile: Club-Detail als Bottom-Sheet */}
        {tab === "discover" && sel && (
          <div className="mu-sheet absolute inset-x-0 bottom-0 z-[600] h-[66%] overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 md:hidden">
            <VenueDetail venue={sel} onBack={backToList} sheet />
          </div>
        )}

        {/* Mobile: Saisonplaner als Bottom-Sheet, Karte + Route bleiben sichtbar */}
        {tab === "season" && (
          <div className="mu-sheet absolute inset-x-0 bottom-0 z-[600] flex h-[70%] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 md:hidden">
            <div className="flex shrink-0 justify-center pt-2.5">
              <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
            </div>
            <SeasonPlanner
              planIds={planIds}
              onTogglePlan={togglePlan}
              start={startBase}
              setStart={setStartBase}
              budget={budget}
              setBudget={setBudget}
              selTid={selTid}
              setSelTid={setSelTid}
              onFocus={focusTour}
              onSmartFill={smartFill}
              onCheapestStart={cheapestStart}
              tours={tours}
              profile={profile}
              setProfile={setProfile}
              onlyEligible={onlyEligible}
              setOnlyEligible={setOnlyEligible}
              venues={venues}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  small = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full font-semibold transition-colors ${
        small ? "px-4 py-1.5 text-sm" : "flex-1 px-3 py-2 text-sm"
      } ${active ? "bg-matchup text-white shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}
    >
      {children}
    </button>
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
