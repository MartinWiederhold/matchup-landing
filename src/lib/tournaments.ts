// Turnier-Daten + Saison-/Budget-Logik für den "Saison planen"-Tab auf /map.
// Kuratierter, realistischer Tour-Kalender (2026). Keine externe API nötig.

export type Surface = "Sand" | "Hartplatz" | "Rasen";
export type Tier =
  | "GS"
  | "ATP1000"
  | "ATP500"
  | "ATP250"
  | "CH125"
  | "CH100"
  | "CH75"
  | "CH50"
  | "ITF25"
  | "ITF15";

export type Tournament = {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  tier: Tier;
  surface: Surface;
  indoor: boolean;
  start: string; // ISO
  end: string; // ISO
};

// Punkte je Runde [Sieger, Finale, HF, VF, AF] + Preisgeld (Sieger, EUR) + Farbe + Kürzel
export const TIER_META: Record<
  Tier,
  { label: string; short: string; group: "GS" | "ATP" | "Challenger" | "ITF"; points: number[]; prize: number; color: string }
> = {
  GS: { label: "Grand Slam", short: "GS", group: "GS", points: [2000, 1300, 800, 400, 200], prize: 2200000, color: "#0f172a" },
  ATP1000: { label: "ATP Masters 1000", short: "M1000", group: "ATP", points: [1000, 650, 400, 200, 100], prize: 900000, color: "#b45309" },
  ATP500: { label: "ATP 500", short: "500", group: "ATP", points: [500, 330, 200, 100, 50], prize: 420000, color: "#7c3aed" },
  ATP250: { label: "ATP 250", short: "250", group: "ATP", points: [250, 165, 100, 50, 25], prize: 110000, color: "#2563eb" },
  CH125: { label: "Challenger 125", short: "CH125", group: "Challenger", points: [125, 75, 45, 22, 11], prize: 21600, color: "#ea580c" },
  CH100: { label: "Challenger 100", short: "CH100", group: "Challenger", points: [100, 60, 36, 18, 9], prize: 14400, color: "#ea580c" },
  CH75: { label: "Challenger 75", short: "CH75", group: "Challenger", points: [75, 44, 25, 12, 6], prize: 10800, color: "#f97316" },
  CH50: { label: "Challenger 50", short: "CH50", group: "Challenger", points: [50, 28, 16, 8, 4], prize: 7200, color: "#f97316" },
  ITF25: { label: "ITF M25", short: "M25", group: "ITF", points: [25, 16, 10, 5, 2], prize: 3600, color: "#64748b" },
  ITF15: { label: "ITF M15", short: "M15", group: "ITF", points: [15, 10, 6, 3, 1], prize: 2160, color: "#94a3b8" },
};

export const ROUND_LABELS = ["Sieger", "Finale", "Halbfinale", "Viertelfinale", "Achtelfinale"];

export type HomeBase = { name: string; lat: number; lng: number };
export const HOME_BASES: HomeBase[] = [
  { name: "Zürich", lat: 47.3769, lng: 8.5417 },
  { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
];

// Realistischer Kalender 2026 (chronologisch)
export const TOURNAMENTS: Tournament[] = [
  { id: "ao", name: "Australian Open", city: "Melbourne", country: "Australien", lat: -37.8199, lng: 144.9787, tier: "GS", surface: "Hartplatz", indoor: false, start: "2026-01-19", end: "2026-02-01" },
  { id: "marseille", name: "Open 13 Marseille", city: "Marseille", country: "Frankreich", lat: 43.2965, lng: 5.3698, tier: "ATP250", surface: "Hartplatz", indoor: true, start: "2026-02-09", end: "2026-02-15" },
  { id: "cherbourg", name: "Challenger Cherbourg", city: "Cherbourg", country: "Frankreich", lat: 49.6337, lng: -1.622, tier: "CH125", surface: "Hartplatz", indoor: true, start: "2026-02-16", end: "2026-02-22" },
  { id: "dubai", name: "Dubai Championships", city: "Dubai", country: "VAE", lat: 25.2048, lng: 55.2708, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-02-23", end: "2026-03-01" },
  { id: "indianwells", name: "Indian Wells Masters", city: "Indian Wells", country: "USA", lat: 33.7206, lng: -116.3053, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-03-11", end: "2026-03-22" },
  { id: "miami", name: "Miami Open", city: "Miami", country: "USA", lat: 25.7581, lng: -80.1387, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-03-25", end: "2026-04-05" },
  { id: "montecarlo", name: "Monte-Carlo Masters", city: "Monaco", country: "Monaco", lat: 43.7384, lng: 7.4246, tier: "ATP1000", surface: "Sand", indoor: false, start: "2026-04-12", end: "2026-04-19" },
  { id: "vic", name: "ITF M25 Vic", city: "Vic", country: "Spanien", lat: 41.9301, lng: 2.2549, tier: "ITF25", surface: "Sand", indoor: false, start: "2026-04-13", end: "2026-04-19" },
  { id: "barcelona", name: "Barcelona Open", city: "Barcelona", country: "Spanien", lat: 41.3851, lng: 2.1734, tier: "ATP500", surface: "Sand", indoor: false, start: "2026-04-20", end: "2026-04-26" },
  { id: "madrid", name: "Madrid Open", city: "Madrid", country: "Spanien", lat: 40.4168, lng: -3.7038, tier: "ATP1000", surface: "Sand", indoor: false, start: "2026-04-29", end: "2026-05-10" },
  { id: "rome", name: "Italian Open Rom", city: "Rom", country: "Italien", lat: 41.9028, lng: 12.4964, tier: "ATP1000", surface: "Sand", indoor: false, start: "2026-05-13", end: "2026-05-24" },
  { id: "rolandgarros", name: "Roland-Garros", city: "Paris", country: "Frankreich", lat: 48.847, lng: 2.253, tier: "GS", surface: "Sand", indoor: false, start: "2026-05-25", end: "2026-06-07" },
  { id: "stuttgart", name: "BOSS Open Stuttgart", city: "Stuttgart", country: "Deutschland", lat: 48.8055, lng: 9.171, tier: "ATP250", surface: "Rasen", indoor: false, start: "2026-06-08", end: "2026-06-14" },
  { id: "halle", name: "Terra Wortmann Open Halle", city: "Halle", country: "Deutschland", lat: 52.06, lng: 8.35, tier: "ATP500", surface: "Rasen", indoor: false, start: "2026-06-15", end: "2026-06-21" },
  { id: "queens", name: "Queen's Club London", city: "London", country: "Grossbritannien", lat: 51.4841, lng: -0.2135, tier: "ATP500", surface: "Rasen", indoor: false, start: "2026-06-15", end: "2026-06-21" },
  { id: "wimbledon", name: "Wimbledon", city: "London", country: "Grossbritannien", lat: 51.434, lng: -0.2144, tier: "GS", surface: "Rasen", indoor: false, start: "2026-06-29", end: "2026-07-12" },
  { id: "braunschweig", name: "Challenger Braunschweig", city: "Braunschweig", country: "Deutschland", lat: 52.2689, lng: 10.5268, tier: "CH125", surface: "Sand", indoor: false, start: "2026-07-06", end: "2026-07-12" },
  { id: "hamburg", name: "Hamburg Open", city: "Hamburg", country: "Deutschland", lat: 53.573, lng: 9.994, tier: "ATP500", surface: "Sand", indoor: false, start: "2026-07-13", end: "2026-07-19" },
  { id: "porto", name: "Challenger Porto", city: "Porto", country: "Portugal", lat: 41.1579, lng: -8.6291, tier: "CH100", surface: "Sand", indoor: false, start: "2026-07-20", end: "2026-07-26" },
  { id: "toronto", name: "Canadian Open Toronto", city: "Toronto", country: "Kanada", lat: 43.6532, lng: -79.3832, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-08-05", end: "2026-08-16" },
  { id: "cincinnati", name: "Cincinnati Open", city: "Cincinnati", country: "USA", lat: 39.1031, lng: -84.512, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-08-13", end: "2026-08-24" },
  { id: "usopen", name: "US Open", city: "New York", country: "USA", lat: 40.7498, lng: -73.8459, tier: "GS", surface: "Hartplatz", indoor: false, start: "2026-08-31", end: "2026-09-13" },
  { id: "tokyo", name: "Kinoshita Group Japan Open", city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, tier: "ATP500", surface: "Hartplatz", indoor: false, start: "2026-09-28", end: "2026-10-04" },
  { id: "shanghai", name: "Shanghai Masters", city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, tier: "ATP1000", surface: "Hartplatz", indoor: false, start: "2026-10-07", end: "2026-10-18" },
  { id: "vienna", name: "Erste Bank Open Wien", city: "Wien", country: "Österreich", lat: 48.2082, lng: 16.3738, tier: "ATP500", surface: "Hartplatz", indoor: true, start: "2026-10-26", end: "2026-11-01" },
  { id: "parisbercy", name: "Rolex Paris Masters", city: "Paris", country: "Frankreich", lat: 48.8566, lng: 2.3522, tier: "ATP1000", surface: "Hartplatz", indoor: true, start: "2026-11-02", end: "2026-11-08" },
];

// Offizielle Turnier-Website (öffentliche Quelle) + verifiziertes Sieger-Preisgeld (EUR).
// Wird aus öffentlichen Quellen (ATP/ITF/offizielle Seiten) gepflegt.
export const TOURNAMENT_URL: Record<string, string> = {
  ao: "https://ausopen.com",
  marseille: "https://www.open13.fr",
  cherbourg: "https://www.challengerdecherbourg.fr",
  dubai: "https://dubaidutyfreetennischampionships.com",
  indianwells: "https://bnpparibasopen.com",
  miami: "https://www.miamiopen.com",
  montecarlo: "https://montecarlotennismasters.com",
  barcelona: "https://www.barcelonaopenbancsabadell.com",
  madrid: "https://www.mutuamadridopen.com",
  rome: "https://www.internazionalibnlditalia.com",
  rolandgarros: "https://www.rolandgarros.com",
  stuttgart: "https://www.mercedescup.de",
  halle: "https://www.terrawortmann-open.de",
  queens: "https://www.lta.org.uk/fan-zone/international/hsbc-championships/",
  wimbledon: "https://www.wimbledon.com",
  braunschweig: "https://brawo-open.de",
  hamburg: "https://hamburgopenatp500.com",
  porto: "https://eupagoportoopen.org",
  toronto: "https://nationalbankopen.com",
  cincinnati: "https://cincinnatiopen.com",
  usopen: "https://www.usopen.org",
  tokyo: "https://www.japanopentennis.com",
  shanghai: "https://www.shanghairolexmasters.com",
  vienna: "https://www.erstebankopen.com",
  parisbercy: "https://www.rolexparismasters.com",
};
// Sieger-Preisgeld (Einzel, ca. EUR) – öffentliche Turnier-/ATP-Angaben, letzte Edition (2025)
export const TOURNAMENT_PRIZE: Record<string, number> = {
  ao: 2100000, marseille: 112660, cherbourg: 12980, dubai: 557088, indianwells: 1105035,
  miami: 1034430, montecarlo: 946610, barcelona: 500000, madrid: 1000000, rome: 950000,
  rolandgarros: 2400000, stuttgart: 130000, halle: 420000, queens: 471755, wimbledon: 3510000,
  braunschweig: 25740, hamburg: 403665, porto: 20630, toronto: 1034430, cincinnati: 1034430,
  usopen: 3300000, tokyo: 400000, shanghai: 1000000, vienna: 430000, parisbercy: 950000,
};
export const prizeFor = (t: Tournament) => TOURNAMENT_PRIZE[t.id] ?? TIER_META[t.tier].prize;
// offizielle Seite wenn bekannt, sonst nie-toter Such-Fallback → jedes Turnier hat IMMER einen Link
export const urlFor = (t: Tournament): { url: string; official: boolean } =>
  TOURNAMENT_URL[t.id]
    ? { url: TOURNAMENT_URL[t.id], official: true }
    : { url: `https://www.google.com/search?q=${encodeURIComponent(t.name + " tennis " + t.start.slice(0, 4))}`, official: false };

export const byDate = (a: Tournament, b: Tournament) => a.start.localeCompare(b.start);

const MS_DAY = 86400000;
export function nights(t: Tournament): number {
  return Math.max(1, Math.round((Date.parse(t.end) - Date.parse(t.start)) / MS_DAY) + 1);
}
export function entryDeadline(t: Tournament): string {
  return new Date(Date.parse(t.start) - 42 * MS_DAY).toISOString().slice(0, 10);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}
export function fmtRange(t: Tournament): string {
  return `${fmtDate(t.start)}–${fmtDate(t.end)}`;
}
export function fmtEUR(n: number): string {
  return n.toLocaleString("de-CH", { maximumFractionDigits: 0 }) + " €";
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const HOTEL_NIGHT: Record<Tier, number> = {
  GS: 190, ATP1000: 180, ATP500: 160, ATP250: 140, CH125: 95, CH100: 90, CH75: 85, CH50: 80, ITF25: 70, ITF15: 65,
};
const ENTRY_FEE: Record<Tier, number> = {
  GS: 0, ATP1000: 0, ATP500: 0, ATP250: 0, CH125: 0, CH100: 0, CH75: 0, CH50: 0, ITF25: 45, ITF15: 40,
};
const TRANSFER = 45;

export type Leg = { from: string; to: string; mode: "Flug" | "Bahn" | "Auto"; km: number; cost: number };
export function leg(from: { name?: string; city?: string; lat: number; lng: number }, to: { name?: string; city?: string; lat: number; lng: number }): Leg {
  const km = haversine(from, to);
  let mode: Leg["mode"];
  let cost: number;
  if (km < 250) { mode = "Auto"; cost = Math.round(km * 0.35) + 20; }
  else if (km < 700) { mode = "Bahn"; cost = Math.round(km * 0.14) + 30; }
  else { mode = "Flug"; cost = Math.round(km * 0.11) + 60; }
  return { from: from.name ?? from.city ?? "", to: to.name ?? to.city ?? "", mode, km, cost };
}

export type PlanCost = {
  perTour: { t: Tournament; nights: number; hotel: number; transfer: number; entry: number; total: number; leg: Leg }[];
  travel: number;
  hotels: number;
  transfers: number;
  entry: number;
  total: number;
  points: number;
  prize: number;
};
// Smart-Planer: beste Startbasis (minimale Reisekosten) für einen gegebenen Plan
export function bestStartBase(plan: Tournament[]): HomeBase {
  let best = HOME_BASES[0];
  let bestCost = Infinity;
  for (const b of HOME_BASES) {
    const c = computePlan(plan, b).travel;
    if (c < bestCost) { bestCost = c; best = b; }
  }
  return best;
}

// Smart-Planer: kostengünstigste Saison im Budget zusammenstellen.
// Greedy nach bestem Punkte-pro-Zusatzkosten-Verhältnis → bündelt automatisch geografisch
// (nahe Turniere haben tiefe Zusatz-Reisekosten → hohes Verhältnis) und spart so Flüge.
export function autoPlan(budgetLimit: number, start: HomeBase): string[] {
  const chosen: Tournament[] = [];
  const remaining = new Set(TOURNAMENTS.map((t) => t.id));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const base = computePlan([...chosen].sort(byDate), start).total;
    let best: { t: Tournament; ratio: number } | null = null;
    for (const id of remaining) {
      const t = TOURNAMENTS.find((x) => x.id === id)!;
      const trial = [...chosen, t].sort(byDate);
      const c = computePlan(trial, start);
      if (c.total > budgetLimit) continue;
      const marginalCost = Math.max(1, c.total - base);
      const ratio = TIER_META[t.tier].points[0] / marginalCost;
      if (!best || ratio > best.ratio) best = { t, ratio };
    }
    if (!best) break;
    chosen.push(best.t);
    remaining.delete(best.t.id);
  }
  return chosen.sort(byDate).map((t) => t.id);
}

export function computePlan(plan: Tournament[], start: HomeBase): PlanCost {
  let travel = 0, hotels = 0, transfers = 0, entry = 0, points = 0, prize = 0;
  let prev: { name?: string; city?: string; lat: number; lng: number } = start;
  const perTour = plan.map((t) => {
    const lg = leg(prev, t);
    const n = nights(t);
    const hotel = n * HOTEL_NIGHT[t.tier];
    const fee = ENTRY_FEE[t.tier];
    const meta = TIER_META[t.tier];
    travel += lg.cost; hotels += hotel; transfers += TRANSFER; entry += fee;
    points += meta.points[0]; prize += prizeFor(t);
    prev = t;
    return { t, nights: n, hotel, transfer: TRANSFER, entry: fee, total: lg.cost + hotel + TRANSFER + fee, leg: lg };
  });
  return { perTour, travel, hotels, transfers, entry, total: travel + hotels + transfers + entry, points, prize };
}
