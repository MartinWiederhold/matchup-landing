"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  TIER_META,
  ROUND_LABELS,
  HOME_BASES,
  byDate,
  nights,
  entryDeadline,
  fmtRange,
  fmtDate,
  fmtEUR,
  computePlan,
  regionMatch,
  projectSeasonPoints,
  pointsToRank,
  prizeFor,
  prizeByRound,
  urlFor,
  tournamentLogo,
  CLUSTER_HUBS,
  EXTRAS,
  planSpanDays,
  type Tournament,
  type HomeBase,
  type RegionFilter,
} from "@/lib/tournaments";
import {
  eligibility,
  cutoffFor,
  strategyFor,
  loadPresence,
  joinPresence,
  leavePresence,
  currentUserId,
  ELIG_COLOR,
  missingDocs,
  requiredDocs,
  DOC_LABELS,
  type PlayerProfile,
  type PlayerDocs,
  type Presence,
} from "@/lib/player";
import type { Venue } from "@/lib/venuesDb";
import { hotelUrl, flightUrl, carUrl, hotelPriceQuery, flightPriceQuery, type LivePrice } from "@/lib/travelpayouts";
import { useLocale } from "@/lib/i18n";

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

const GROUPS = ["Alle", "Grand Slam", "ATP", "Challenger", "ITF"] as const;
const SURFACES = ["Alle", "Sand", "Hartplatz", "Rasen"] as const;
const SURFACE_LABEL: Record<string, string> = { Sand: "Sand", Hartplatz: "Hard", Rasen: "Rasen" };
const SURFACE_LABEL_EN: Record<string, string> = { Sand: "Clay", Hartplatz: "Hard", Rasen: "Grass" };
const ROUND_LABELS_EN = ["Winner", "Final", "Semifinal", "Quarterfinal", "Round of 16"];
const EXTRAS_EN: Record<string, string> = {
  Besaitungsservice: "Stringing service",
  Physiotherapie: "Physiotherapy",
  Fitnessstudio: "Gym",
  Spielerrestaurant: "Players' restaurant",
  "Players Lounge": "Players' lounge",
  Shuttle: "Shuttle",
  "Wäscheservice": "Laundry service",
  "Offizielles Spielerhotel": "Official player hotel",
  "Trainingsplätze": "Practice courts",
  Hawkeye: "Hawk-Eye",
  "Live-Streaming": "Live streaming",
};
const DOC_LABELS_EN: Record<string, string> = {
  passport: "Passport",
  id: "ID card",
  visa: "Visa",
  ipin: "IPIN / World Tennis ID",
  playerEducation: "Player Education Course",
  license: "Player license",
  federationLicense: "Federation license",
  medical: "Medical Certificate",
  insurance: "Insurance",
  vaccination: "Vaccinations",
};
const LEG_MODE_EN: Record<string, string> = { Flug: "Flight", Bahn: "Train", Auto: "Drive" };
const POI_LABEL_EN: Record<string, string> = {
  food: "Restaurants & cafés",
  physio: "Physio",
  stringer: "Stringing & sports shop",
  fitness: "Fitness & sports center",
  supermarket: "Supermarket",
  pharmacy: "Pharmacy",
};

/* Eigenes Ziel-Icon (ersetzt das 🎯-Emoji) — Fadenkreuz mit Treffer im Zentrum. */
function TargetIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </svg>
  );
}

/* Modernes Dropdown statt nativem <select> (das sieht auf macOS grauslig aus). */
function CountryPicker({
  value, options, allLabel, onChange,
}: { value: string; options: string[]; allLabel: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const items = ["", ...options];
  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-full px-3.5 py-2 text-left text-[12px] font-semibold transition ${
          open ? "bg-white/[0.14] text-white ring-1 ring-white/30" : "bg-white/[0.07] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12]"
        }`}
      >
        <span className="truncate">{value || allLabel}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-2xl bg-[#1a1a4d] p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/15">
          {items.map((c) => {
            const sel = c === value;
            return (
              <button
                key={c || "__all"}
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-semibold transition ${
                  sel ? "bg-emerald-400/15 text-emerald-300" : "text-white/75 hover:bg-white/[0.08]"
                }`}
              >
                <span className="truncate">{c || allLabel}</span>
                {sel && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SeasonPlanner({
  planIds,
  onTogglePlan,
  start,
  setStart,
  budget,
  setBudget,
  region,
  setRegion,
  countryFilter = "",
  setCountryFilter,
  classFilter = "",
  setClassFilter,
  seasonStart,
  setSeasonStart,
  selTid,
  setSelTid,
  onFocus,
  onSmartFill,
  onCheapestStart,
  tours,
  profile,
  setProfile,
  onlyEligible,
  setOnlyEligible,
  venues,
  profileSynced,
  profileEmail,
  onSignIn,
  onSignUp,
  onSignOut,
}: {
  planIds: string[];
  onTogglePlan: (id: string) => void;
  start: HomeBase;
  setStart: (b: HomeBase) => void;
  budget: number;
  setBudget: (n: number) => void;
  region: RegionFilter;
  setRegion: (r: RegionFilter) => void;
  countryFilter?: string;
  setCountryFilter?: (c: string) => void;
  classFilter?: string;
  setClassFilter?: (c: string) => void;
  seasonStart: string;
  setSeasonStart: (d: string) => void;
  selTid: string | null;
  setSelTid: (id: string | null) => void;
  onFocus: (t: Tournament) => void;
  onSmartFill: () => void;
  onCheapestStart: () => void;
  tours: Tournament[];
  profile: PlayerProfile;
  setProfile: (p: PlayerProfile) => void;
  onlyEligible: boolean;
  setOnlyEligible: (v: boolean) => void;
  venues: Venue[];
  profileSynced: boolean;
  profileEmail: string | null;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  onSignOut: () => Promise<void>;
}) {
  const hasRank = profile.atp != null || profile.wta != null || profile.itf != null;
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Alle");
  const [surface, setSurface] = useState<(typeof SURFACES)[number]>("Alle");
  const [locQuery, setLocQuery] = useState("");

  // Freier Wohnort: alle bekannten Städte (Startbasen + Turnierorte) als wählbare Startpunkte.
  const cityOptions = useMemo(() => {
    const map = new Map<string, HomeBase>();
    for (const b of HOME_BASES) map.set(b.name, b);
    for (const t of tours) if (!map.has(t.city)) map.set(t.city, { name: t.city, lat: t.lat, lng: t.lng });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tours]);
  const locMatches = useMemo(() => {
    const q = locQuery.trim().toLowerCase();
    if (!q) return [];
    return cityOptions.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [locQuery, cityOptions]);

  const plan = useMemo(
    () => planIds.map((id) => tours.find((t) => t.id === id)).filter(Boolean).sort(byDate as never) as Tournament[],
    [planIds, tours],
  );
  const cost = useMemo(() => computePlan(plan, start), [plan, start]);
  const inPlan = (id: string) => planIds.includes(id);

  const catalog = useMemo(() => {
    const cf = (classFilter ?? "").trim().toLowerCase();
    return [...tours].sort(byDate).filter((t) => {
      if (planIds.includes(t.id)) return true;
      if (seasonStart && t.start < seasonStart) return false;
      if (!regionMatch(region, t.country)) return false;
      if (countryFilter && t.country !== countryFilter) return false;
      if (cf && !`${t.classification ?? ""} ${t.category ?? ""} ${t.tier}`.toLowerCase().includes(cf)) return false;
      if (group !== "Alle" && TIER_META[t.tier].group !== group) return false;
      if (surface !== "Alle" && t.surface !== surface) return false;
      return true;
    });
  }, [group, surface, tours, region, seasonStart, planIds, countryFilter, classFilter]);

  // Katalog nach Ort gruppieren: Hubs mit ≥3 Wochen → Cluster-Karte, Rest → Einzelzeilen.
  const grouped = useMemo(() => {
    const byLoc = new Map<string, Tournament[]>();
    for (const t of catalog) {
      if (onlyEligible && hasRank && !planIds.includes(t.id) && eligibility(profile, t).status === "red") continue;
      const k = `${t.city}|${t.country}`;
      const a = byLoc.get(k);
      if (a) a.push(t);
      else byLoc.set(k, [t]);
    }
    const clusters: { key: string; hub: string; country: string; items: Tournament[] }[] = [];
    const singles: Tournament[] = [];
    for (const [key, items] of byLoc) {
      if (items.length >= 3) clusters.push({ key, hub: items[0].city, country: items[0].country, items });
      else singles.push(...items);
    }
    clusters.sort((a, b) => (a.items[0].start < b.items[0].start ? -1 : 1));
    singles.sort(byDate);
    return { clusters, singles };
  }, [catalog, onlyEligible, hasRank, profile, planIds]);

  const sel = selTid ? tours.find((t) => t.id === selTid) ?? null : null;
  if (sel) {
    return <TournamentDetail t={sel} inPlan={inPlan(sel.id)} onToggle={() => onTogglePlan(sel.id)} onFocus={() => onFocus(sel)} onBack={() => setSelTid(null)} start={start} profile={profile} venues={venues} synced={profileSynced} />;
  }

  const spentPct = budget > 0 ? Math.min(100, Math.round((cost.total / budget) * 100)) : 0;
  const remaining = budget - cost.total;
  const over = remaining < 0;
  const flights = cost.perTour.filter((p) => p.leg.mode === "Flug").length;
  const priciest = cost.perTour.reduce<(typeof cost.perTour)[number] | null>(
    (m, p) => (!m || p.leg.cost > m.leg.cost ? p : m),
    null,
  );

  /* Ganze Fläche im Compete-Kachel-Stil: dunkler Indigo-Verlauf, Glas-Karten,
   * grüne Akzente. Einzige Ausnahme: das ausgeklappte Profil-Formular bleibt
   * eine weisse Karte (viele Eingabefelder → wie ein Modal auf Dunkel). */
  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#3b2ecc_0%,#221c7a_38%,#0c0b33_100%)] px-4 pb-4 pt-1 text-white md:space-y-4 md:pt-4">
      {/* Spielerprofil (treibt die Eligibility-Ampel) */}
      <ProfileCard
        profile={profile}
        setProfile={setProfile}
        synced={profileSynced}
        email={profileEmail}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onSignOut={onSignOut}
      />

      {/* Strategie-Empfehlung nach Ranking */}
      <StrategyCard profile={profile} setGroup={setGroup} />

      {/* Status-Übersicht der geplanten Saison */}
      {plan.length > 0 && (
        <StatusOverview plan={plan} profile={profile} hasRank={hasRank} over={over} spentPct={spentPct} />
      )}

      {/* Ranking-Projektion: welchen Rang könntest du mit dieser Saison erreichen? */}
      {plan.length > 0 && <ProjectionCard plan={plan} profile={profile} />}

      {/* Region-Filter: Europa / USA / Alle */}
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">{tt("Region", "Region")}</div>
        <div className="flex gap-1.5">
          {([
            { key: "all", label: tt("Alle", "All") },
            { key: "europe", label: tt("Nur Europa", "Europe only") },
            { key: "usa", label: tt("Nur USA", "USA only") },
          ] as const).map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRegion(r.key)}
              className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors ${
                region === r.key ? "bg-white text-neutral-900" : "bg-white/[0.07] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {/* Feiner Filter: Land + Klassierung/Level (greift, sobald nationale Turniere im Feed sind) */}
        <div className="mt-2 flex gap-1.5">
          <CountryPicker
            value={countryFilter}
            options={[...new Set(tours.map((t) => t.country))].sort()}
            allLabel={tt("Alle Länder", "All countries")}
            onChange={(v) => setCountryFilter?.(v)}
          />
          <input
            value={classFilter}
            onChange={(e) => setClassFilter?.(e.target.value)}
            placeholder={tt("Level / Klassierung (z. B. R1, U14)", "Level / ranking (e.g. R1, U14)")}
            className="flex-[1.4] rounded-full bg-white/[0.07] px-3.5 py-2 text-[12px] font-semibold text-white outline-none ring-1 ring-white/10 placeholder:font-normal placeholder:text-white/35 focus:ring-white/30"
          />
        </div>
      </div>

      {/* Smart-Planer */}
      <div className="rounded-2xl bg-gradient-to-br from-matchup to-indigo-600 p-4 text-white shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold">
          <img src="/smart-planer.png" alt="" className="h-6 w-6 rounded-md object-cover ring-1 ring-white/25" />
          {tt("Smart-Planer", "Smart Planner")}
        </div>
        <p className="mt-0.5 text-xs text-white/80">
          {tt(
            "Füllt automatisch die günstigste Saison für dein Budget – maximale Punkte pro Euro, minimale Flüge.",
            "Automatically fills the cheapest season for your budget – maximum points per euro, minimal flights.",
          )}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onSmartFill}
            className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-matchup shadow-sm transition hover:bg-white/90"
          >
            {tt("Günstigste Saison füllen", "Fill cheapest season")}
          </button>
          <button
            type="button"
            onClick={onCheapestStart}
            disabled={plan.length === 0}
            className="flex-1 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-40"
          >
            {tt("Beste Startbasis", "Best home base")}
          </button>
        </div>
        {plan.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/80">
            <span>{tt(`${plan.length} Turniere`, `${plan.length} tournaments`)}</span>
            <span>· {flights} {flights === 1 ? tt("Flug", "flight") : tt("Flüge", "flights")}</span>
            <span>· {cost.points.toLocaleString("de-CH")} {tt("Punkte", "points")}</span>
            {priciest && <span>· {tt("teuerste Etappe", "priciest leg")}: {priciest.leg.from}→{priciest.leg.to} ({fmtEUR(priciest.leg.cost)})</span>}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white/45">{tt("Budget", "Budget")}</span>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
              className="w-24 rounded-lg bg-white/[0.09] px-2 py-1 text-right font-bold text-white outline-none ring-1 ring-white/15 focus:ring-white/35"
            />
            <span className="font-bold text-white/50">€</span>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${spentPct}%`, background: over ? "#f87171" : "#34d399" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-white/55">{tt("Ausgaben", "Spent")} {fmtEUR(cost.total)}</span>
          <span className={`font-bold ${over ? "text-red-400" : "text-emerald-400"}`}>
            {over ? tt("Über Budget ", "Over budget ") : tt("Rest ", "Left ")} {fmtEUR(Math.abs(remaining))}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <Row label={tt("Reise (Flug/Bahn/Auto)", "Travel (flight/train/drive)")} value={fmtEUR(cost.travel)} />
          <Row label={tt("Unterkunft", "Accommodation")} value={fmtEUR(cost.hotels)} />
          <Row label={tt("Verpflegung", "Food")} value={fmtEUR(cost.food)} />
          <Row label={tt("Transfers", "Transfers")} value={fmtEUR(cost.transfers)} />
          <Row label={tt("Nenngelder", "Entry fees")} value={fmtEUR(cost.entry)} />
        </div>
        <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
          <Stat label={tt("Dauer", "Duration")} value={tt(`${planSpanDays(plan)} T`, `${planSpanDays(plan)} d`)} />
          <Stat label={tt("Punkte bei Sieg", "Points if won")} value={cost.points.toLocaleString("de-CH")} accent />
          <Stat label={tt("Preisgeld bei Sieg", "Prize money if won")} value={fmtEUR(cost.prize)} />
        </div>
      </div>

      {/* Startdatum */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Startdatum", "Start date")}</h3>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={seasonStart}
            min="2026-01-01"
            max="2026-12-31"
            onChange={(e) => setSeasonStart(e.target.value)}
            className="flex-1 rounded-xl bg-white/[0.09] px-3 py-2 text-sm text-white outline-none ring-1 ring-white/15 [color-scheme:dark] focus:ring-white/35"
          />
          {seasonStart && (
            <button type="button" onClick={() => setSeasonStart("")} className="rounded-full bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white/60 ring-1 ring-white/10 hover:bg-white/[0.12]">
              {tt("Ganze Saison", "Whole season")}
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-white/40">{tt("Nur Turniere ab diesem Datum werden geplant & angezeigt.", "Only tournaments from this date are planned & shown.")}</p>
      </div>

      {/* Wohnort / Startpunkt (frei wählbar) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Wohnort / Startpunkt", "Home / start point")}</h3>
        <div className="relative">
          <input
            type="text"
            value={locQuery}
            onChange={(e) => setLocQuery(e.target.value)}
            placeholder={tt(`Aktuell: ${start.name} — Stadt suchen…`, `Current: ${start.name} — search city…`)}
            className="w-full rounded-xl bg-white/[0.09] px-3 py-2 text-sm text-white outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-white/35"
          />
          {locMatches.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl bg-[#1a1a4d] py-1 shadow-lg ring-1 ring-white/15">
              {locMatches.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { setStart(c); setLocQuery(""); }}
                  className="block w-full px-3 py-2 text-left text-sm text-white/75 hover:bg-white/[0.08]"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HOME_BASES.map((b) => {
            const active = b.name === start.name;
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => setStart(b)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? "bg-emerald-500 text-white" : "bg-white/[0.07] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12]"
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meine Saison */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">
          {tt("Meine Saison", "My season")}{plan.length ? ` · ${plan.length} ${tt("Stops", "stops")}` : ""}
        </h3>
        {plan.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-sm text-white/40">
            {tt("Wähle unten Turniere aus – die Route erscheint live auf der Karte.", "Pick tournaments below – the route appears live on the map.")}
          </p>
        ) : (
          <ol className="space-y-1.5">
            <li className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">⌂</span>
              {tt("Start", "Start")} · {start.name}
            </li>
            {cost.perTour.map((p, i) => (
              <li key={p.t.id}>
                <div className="flex items-center gap-1 py-0.5 pl-2 text-[11px] text-white/40">
                  <span>↓ {tt(p.leg.mode, LEG_MODE_EN[p.leg.mode] ?? p.leg.mode)}</span>
                  <span>· {p.leg.km.toLocaleString("de-CH")} km</span>
                  <span>· {fmtEUR(p.leg.cost)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelTid(p.t.id); onFocus(p.t); }}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-white/[0.07] px-2.5 py-2 text-left ring-1 ring-white/10 hover:bg-white/[0.12]"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ background: TIER_META[p.t.tier].color }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.t.name}</span>
                    <span className="block text-[11px] text-white/45">
                      {fmtRange(p.t)} · {TIER_META[p.t.tier].label} · {fmtEUR(p.total)}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onTogglePlan(p.t.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onTogglePlan(p.t.id); } }}
                    className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-white/40 hover:bg-white/10 hover:text-red-400"
                  >
                    {tt("Entfernen", "Remove")}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Turnierkatalog */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">{tt("Turniere", "Tournaments")}</h3>
          {hasRank && (
            <button
              type="button"
              onClick={() => setOnlyEligible(!onlyEligible)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                onlyEligible ? "bg-emerald-500 text-white" : "bg-white/[0.07] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12]"
              }`}
            >
              {onlyEligible ? tt("✓ Nur für mich mögliche", "✓ Eligible for me") : tt("Nur für mich mögliche", "Eligible for me")}
            </button>
          )}
        </div>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <Chip key={g} dark active={group === g} onClick={() => setGroup(g)}>{g === "Alle" ? tt("Alle", "All") : g}</Chip>
          ))}
        </div>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {SURFACES.map((s) => (
            <Chip key={s} dark active={surface === s} onClick={() => setSurface(s)} subtle>
              {s === "Alle" ? tt("Alle Beläge", "All surfaces") : tt(SURFACE_LABEL[s], SURFACE_LABEL_EN[s])}
            </Chip>
          ))}
        </div>
        <div className="space-y-1.5">
          {grouped.clusters.map((c) => (
            <ClusterCard
              key={c.key}
              hub={c.hub}
              country={c.country}
              items={c.items}
              planIds={planIds}
              onOpen={(t) => { setSelTid(t.id); onFocus(t); }}
              onToggle={onTogglePlan}
              eligOf={(t) => (hasRank ? eligibility(profile, t) : null)}
            />
          ))}
          {grouped.singles.map((t) => (
            <CatalogRow
              key={t.id}
              t={t}
              added={inPlan(t.id)}
              el={hasRank ? eligibility(profile, t) : null}
              onOpen={() => { setSelTid(t.id); onFocus(t); }}
              onToggle={() => onTogglePlan(t.id)}
            />
          ))}
          {grouped.clusters.length === 0 && grouped.singles.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-sm text-white/40">{tt("Keine Turniere für diese Auswahl.", "No tournaments for this selection.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

type Elig = ReturnType<typeof eligibility> | null;

function CatalogRow({ t, added, el, onOpen, onToggle }: { t: Tournament; added: boolean; el: Elig; onOpen: () => void; onToggle: () => void }) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const meta = TIER_META[t.tier];
  const logo = tournamentLogo(t);
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-2.5 py-2 ring-1 ring-white/10">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: el ? ELIG_COLOR[el.status] : meta.color }} />
        {logo ? (
          <img src={logo} alt="" className="h-7 w-7 shrink-0 rounded-md bg-white object-contain p-0.5" />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ background: meta.color }}>{meta.short}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{t.name}</span>
          <span className="block text-[11px] text-white/45">{fmtRange(t)} · {t.city} · {tt(SURFACE_LABEL[t.surface], SURFACE_LABEL_EN[t.surface])}{t.indoor ? " (Indoor)" : ""}</span>
        </span>
        <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: meta.color }}>{meta.short}</span>
      </button>
      <button type="button" onClick={onToggle}
        className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors ${added ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-white text-neutral-900 hover:bg-white/90"}`}>
        {added ? "✓" : "+"}
      </button>
    </div>
  );
}

function ClusterCard({
  hub, country, items, planIds, onOpen, onToggle, eligOf,
}: {
  hub: string;
  country: string;
  items: Tournament[];
  planIds: string[];
  onOpen: (t: Tournament) => void;
  onToggle: (id: string) => void;
  eligOf: (t: Tournament) => Elig;
}) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const info = CLUSTER_HUBS.find((h) => h.name === hub);
  const tiers = Array.from(new Set(items.map((t) => TIER_META[t.tier].short)));
  const addedCount = items.filter((t) => planIds.includes(t.id)).length;
  const lowBudget = info?.region === "Nordafrika" || info?.region === "Türkei";
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2.5 p-2.5 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: "linear-gradient(135deg,#4b3bf3,#8b5cf6)" }}>{items.length}×</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{hub}</span>
            {lowBudget && <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">Low-Budget</span>}
          </span>
          <span className="block truncate text-[11px] text-neutral-400">
            {country} · {tiers.join("/")} · {tt(`${items.length} Wochen`, `${items.length} weeks`)}{addedCount ? ` · ${addedCount} ${tt("geplant", "planned")}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-matchup">{open ? tt("Schliessen", "Close") : tt("Wochen", "Weeks")}</span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-neutral-100 p-2.5">
          {info && <p className="text-[11px] text-neutral-500">📍 {info.note}</p>}
          {items.map((t) => (
            <CatalogRow key={t.id} t={t} added={planIds.includes(t.id)} el={eligOf(t)} onOpen={() => onOpen(t)} onToggle={() => onToggle(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TournamentDetail({
  t,
  inPlan,
  onToggle,
  onFocus,
  onBack,
  start,
  profile,
  venues,
  synced,
}: {
  t: Tournament;
  inPlan: boolean;
  onToggle: () => void;
  onFocus: () => void;
  onBack: () => void;
  start: HomeBase;
  profile: PlayerProfile;
  venues: Venue[];
  synced: boolean;
}) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const meta = TIER_META[t.tier];
  const cost = computePlan([t], start).perTour[0];
  const url = urlFor(t);
  const hasRank = profile.atp != null || profile.wta != null || profile.itf != null;
  const elig = hasRank ? eligibility(profile, t) : null;
  const req = requiredDocs(t);
  const missing = missingDocs(profile, t);
  const nearby = venues
    .filter((v) => v.lat != null && v.lng != null && v.sports?.includes("tennis"))
    .map((v) => ({ v, km: haversineKm(t.lat, t.lng, v.lat as number, v.lng as number) }))
    .filter((x) => x.km <= 80)
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  // Wetter: Klimawerte des Vorjahres-Zeitraums am Austragungsort (Open-Meteo, kein Key nötig).
  const wx = useWeather(t);
  // POIs rund ums Turnier (OpenStreetMap/Overpass, kein Key)
  const pois = useNearbyPOIs(t);

  // Buchungs-Deep-Links: Travelpayouts-Affiliate (Provision), sobald NEXT_PUBLIC_TP_MARKER gesetzt ist,
  // sonst sauberer Fallback auf Booking/Google.
  const stop = { city: t.city, country: t.country, start: t.start, end: t.end };
  const bookingUrl = hotelUrl(stop);
  const carLink = carUrl(stop);
  const flightLink = flightUrl(stop, profile.homeAirport || undefined);
  // Echte Preise (nur wenn TRAVELPAYOUTS_TOKEN server-seitig gesetzt ist)
  const live = useLivePrices(stop, profile.homeAirport || undefined);
  const hotelSub = live.hotel.price != null ? `${tt("ab", "from")} ${fmtEUR(live.hotel.price)}` : tt(`${nights(t)} Nächte`, `${nights(t)} nights`);
  const flightSub = live.flight.price != null ? `${tt("ab", "from")} ${fmtEUR(live.flight.price)}` : profile.homeAirport || tt("ab Heimat", "from home");

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-matchup hover:underline">
        {tt("← Saison", "← Season")}
      </button>
      <div className="flex items-start gap-3">
        {tournamentLogo(t) && (
          <img src={tournamentLogo(t)!} alt="" className="mt-0.5 h-12 w-12 shrink-0 rounded-xl object-contain ring-1 ring-neutral-200" />
        )}
        <div className="min-w-0">
          <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: meta.color }}>
            {meta.label}
          </span>
          <h2 className="mt-1.5 text-xl font-bold leading-tight tracking-tight">{t.name}</h2>
          <p className="text-sm text-neutral-500">
            {t.city}, {t.country} · {tt(SURFACE_LABEL[t.surface], SURFACE_LABEL_EN[t.surface])}
            {t.indoor ? " (Indoor)" : " (Outdoor)"}
          </p>
        </div>
      </div>

      {/* Eligibility-Ampel */}
      {elig ? (
        <div className="rounded-2xl p-3" style={{ background: ELIG_COLOR[elig.status] + "1a" }}>
          <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: ELIG_COLOR[elig.status] }}>
            <span>{elig.status === "green" ? "🟢" : elig.status === "yellow" ? "🟡" : "🔴"}</span>
            {elig.label}
          </div>
          <ul className="mt-2 space-y-1">
            {elig.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-neutral-600">
                <span className={r.ok ? "text-emerald-600" : "text-red-500"}>{r.ok ? "✔" : "✕"}</span>
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-500">
          {tt(
            "Trage im Profil dein Ranking und Geburtsdatum ein, um zu sehen, ob du hier teilnehmen kannst.",
            "Enter your ranking and date of birth in your profile to see whether you can play here.",
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className={`flex flex-1 items-center justify-center rounded-full px-3 py-3 text-sm font-bold ${
              inPlan ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-matchup text-white hover:bg-matchup-hover"
            }`}
          >
            {inPlan ? tt("✓ In der Saison", "✓ In the season") : tt("+ Zur Saison hinzufügen", "+ Add to season")}
          </button>
          <button
            type="button"
            onClick={onFocus}
            className="flex flex-1 items-center justify-center rounded-full border border-neutral-300 px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {tt("Auf Karte zeigen", "Show on map")}
          </button>
        </div>
        <a
          href={url.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-full border border-neutral-300 px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          {url.official ? tt("Offizielle Turnierseite ↗", "Official tournament site ↗") : tt("Turnier-Infos suchen ↗", "Search tournament info ↗")}
        </a>
      </div>

      {/* Wer ist diese Woche hier? + Trainingspartner (Community, opt-in) */}
      <PresenceSection t={t} profile={profile} synced={synced} />

      <div className="grid grid-cols-2 gap-2">
        <Fact label={tt("Termin", "Date")} value={fmtRange(t)} />
        <Fact label={tt("Meldeschluss", "Entry deadline")} value={fmtDate(entryDeadline(t))} />
        <Fact label={tt("Preisgeld (Sieger)", "Prize money (winner)")} value={fmtEUR(prizeFor(t))} />
        <Fact label={tt("Aufenthalt", "Stay")} value={tt(`${nights(t)} Nächte`, `${nights(t)} nights`)} />
      </div>

      {/* Cut-Off (Meldeliste offiziell, sonst kalibrierter Richtwert) */}
      {(() => {
        const co = cutoffFor(t);
        return (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <div className="text-sm">
              <span className="font-semibold text-neutral-700">Cut-Off</span>
              <span className="text-neutral-500"> · {tt("Hauptfeld", "Main draw")} ~{co.direct} · {tt("Quali", "Qualifying")} ~{co.quali}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${co.official ? "bg-emerald-50 text-emerald-600" : "bg-neutral-200 text-neutral-500"}`}>
              {co.official ? "offiziell" : "Richtwert"}
            </span>
          </div>
        );
      })()}

      {/* Wetter zur Turnierzeit (Klimawerte Vorjahr) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Wetter zur Turnierzeit", "Weather during the tournament")}</h3>
        {t.indoor ? (
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">
            <span>🏟️</span> {tt("Indoor-Turnier – wetterunabhängig.", "Indoor tournament – weather-independent.")}
          </div>
        ) : wx === "loading" ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-400">{tt("Wetterdaten werden geladen …", "Loading weather data …")}</div>
        ) : wx === "err" ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400">{tt("Wetterdaten aktuell nicht verfügbar.", "Weather data currently unavailable.")}</div>
        ) : (
          <>
            <div
              className="grid grid-cols-3 overflow-hidden rounded-2xl border border-neutral-200 text-center"
              style={{ background: `linear-gradient(135deg, ${wx.maxT >= 26 ? "#fff7ed" : wx.maxT >= 15 ? "#f0f9ff" : "#eef2ff"}, #ffffff)` }}
            >
              <div className="px-2 py-3">
                <div className="text-lg">{wx.maxT >= 28 ? "🔥" : wx.maxT >= 18 ? "☀️" : wx.maxT >= 8 ? "⛅" : "❄️"}</div>
                <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-800">{wx.maxT}°</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{tt("Tag Ø", "Day avg")}</div>
              </div>
              <div className="border-x border-neutral-100 px-2 py-3">
                <div className="text-lg">🌙</div>
                <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-800">{wx.minT}°</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{tt("Nacht Ø", "Night avg")}</div>
              </div>
              <div className="px-2 py-3">
                <div className="text-lg">{wx.rainDays >= 3 ? "🌧️" : wx.rainDays >= 1 ? "🌦️" : "💧"}</div>
                <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-800">{wx.rainDays}</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{tt("Regentage", "Rain days")}</div>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-400">{tt("Ø der Vorsaison am Austragungsort · Quelle: Open-Meteo", "Prev-season avg at the venue · Source: Open-Meteo")}</p>
          </>
        )}
      </div>

      {(() => {
        const weekCost = cost.hotel + cost.food + cost.transfer + cost.entry; // Woche vor Ort, ohne Anreise
        const roundPrize = prizeByRound(t);
        let beIdx = -1;
        for (let i = roundPrize.length - 1; i >= 0; i--) if (roundPrize[i] >= weekCost) { beIdx = i; break; }
        return (
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Punkte & Preisgeld je Runde", "Points & prize money per round")}</h3>
            {/* Break-even */}
            <div className="mb-2 rounded-2xl p-3" style={{ background: beIdx >= 0 ? "#ecfdf5" : "#fff7ed" }}>
              <div className="flex items-center gap-1.5 text-sm font-extrabold" style={{ color: beIdx >= 0 ? "#059669" : "#c2410c" }}>
                <span>{beIdx >= 0 ? "💰" : "⚠️"}</span>
                {beIdx >= 0 ? tt(`Kostendeckend ab ${ROUND_LABELS[beIdx]}`, `Breaks even from ${ROUND_LABELS_EN[beIdx]}`) : tt("Deckt die Woche nicht", "Doesn't cover the week")}
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {tt(
                  `Woche vor Ort ~${fmtEUR(weekCost)} (ohne Anreise) · Preisgeld brutto, vor Steuern`,
                  `Week on site ~${fmtEUR(weekCost)} (excl. travel) · prize money gross, before tax`,
                )}
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                <span>{tt("Runde", "Round")}</span>
                <span className="flex gap-4"><span className="w-16 text-right">{tt("Preisgeld", "Prize")}</span><span className="w-12 text-right">{tt("Punkte", "Points")}</span></span>
              </div>
              {meta.points.map((p, i) => {
                const be = i === beIdx;
                return (
                  <div key={i} className={`flex items-center justify-between border-b border-neutral-100 px-3 py-2 text-sm last:border-0 ${be ? "bg-emerald-50" : ""}`}>
                    <span className={be ? "font-bold text-emerald-700" : "text-neutral-500"}>{tt(ROUND_LABELS[i], ROUND_LABELS_EN[i])}{be ? " · Break-even" : ""}</span>
                    <span className="flex gap-4">
                      <span className="w-16 text-right font-semibold">{fmtEUR(roundPrize[i])}</span>
                      <span className="w-12 text-right font-bold">{p} {tt("Pkt", "pts")}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Benötigte Dokumente", "Required documents")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {req.map((k) => {
            const ok = !missing.includes(k);
            return (
              <span
                key={k}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {ok ? "✔" : "⚠"} {tt(DOC_LABELS[k], DOC_LABELS_EN[k])}
              </span>
            );
          })}
        </div>
        {missing.length > 0 && (
          <p className="mt-2 text-xs text-red-600">
            ⚠ {tt("Fehlt", "Missing")}: {missing.map((k) => tt(DOC_LABELS[k], DOC_LABELS_EN[k])).join(", ")} — {tt("im Profil abhaken.", "check off in your profile.")}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Kosten ab", "Costs from")} {start.name}</h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <Line label={tt(`Anreise (${cost.leg.mode}, ${cost.leg.km.toLocaleString("de-CH")} km)`, `Travel (${LEG_MODE_EN[cost.leg.mode] ?? cost.leg.mode}, ${cost.leg.km.toLocaleString("de-CH")} km)`)} value={fmtEUR(cost.leg.cost)} />
          <Line label={tt(`Unterkunft (${cost.nights} Nächte)`, `Accommodation (${cost.nights} nights)`)} value={fmtEUR(cost.hotel)} />
          <Line label={tt(`Verpflegung (${cost.nights} Tage)`, `Food (${cost.nights} days)`)} value={fmtEUR(cost.food)} />
          <Line label={tt("Transfer", "Transfer")} value={fmtEUR(cost.transfer)} />
          {cost.entry > 0 && <Line label={tt("Nenngeld", "Entry fee")} value={fmtEUR(cost.entry)} />}
          <div className="flex items-center justify-between bg-neutral-50 px-3 py-2.5 text-sm font-bold">
            <span>{tt("Gesamt", "Total")}</span>
            <span>{fmtEUR(cost.total)}</span>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-400">{tt(`Kosten regional kalibriert (${t.country}). Richtwerte – Live-Preise beim Anbieter buchen ↓`, `Costs calibrated regionally (${t.country}). Estimates – book live prices with the provider ↓`)}</p>
      </div>

      {/* Unterkunft & Transfer – Deep-Links (Buchung beim Anbieter, für Turnierdaten vorausgefüllt) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Unterkunft & Transfer", "Accommodation & transfer")}</h3>
        <div className="grid grid-cols-3 gap-2">
          <BookLink href={bookingUrl} kind="hotel" label={tt("Hotels", "Hotels")} sub={hotelSub} live={live.hotel.price != null} />
          <BookLink href={flightLink} kind="flight" label={tt("Flüge", "Flights")} sub={flightSub} live={live.flight.price != null} />
          <BookLink href={carLink} kind="car" label={tt("Mietwagen", "Rental car")} sub={t.city} />
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-400">
          {live.hotel.price != null || live.flight.price != null
            ? tt("Echte Preise (ab), tagesaktuell. Öffnet den Anbieter in neuem Tab.", "Real prices (from), updated daily. Opens the provider in a new tab.")
            : tt("Vorausgefüllt mit Ort & Turnierdaten. Öffnet den Anbieter in neuem Tab.", "Pre-filled with location & tournament dates. Opens the provider in a new tab.")}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Vor Ort", "On site")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {EXTRAS[t.tier].map((x) => (
            <span key={x} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">✔ {tt(x, EXTRAS_EN[x] ?? x)}</span>
          ))}
        </div>
      </div>

      {/* Rund ums Turnier (OSM) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Rund ums Turnier", "Around the tournament")}</h3>
        <POINearby pois={pois} />
      </div>

      {nearby.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">{tt("Trainingsplätze in der Nähe", "Practice courts nearby")}</h3>
          <div className="space-y-1.5">
            {nearby.map(({ v, km }) => (
              <a
                key={v.id}
                href={v.website || `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 hover:border-matchup/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{v.name}</span>
                  <span className="block text-[11px] text-white/45">{v.city ? `${v.city} · ` : ""}{tt(`${km} km entfernt`, `${km} km away`)}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-matchup">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <span className="min-w-0 text-white/50">{label}</span>
      <span className="shrink-0 whitespace-nowrap font-semibold text-white/85">{value}</span>
    </div>
  );
}
function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex-1 rounded-xl px-3 py-2 ${accent ? "bg-emerald-400/10 ring-1 ring-emerald-400/25" : "bg-white/[0.06]"}`}>
      <div className={`text-sm font-extrabold ${accent ? "text-emerald-400" : "text-white"}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 text-sm last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
function StatusRing({ id, label, value, pct, done }: { id: number; label: string; value: string; pct: number; done: boolean }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const p = Math.min(100, Math.max(0, pct));
  const off = C * (1 - p / 100);
  const gid = `mu-ring-${id}`;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={R} fill="none" stroke={`url(#${gid})`} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={off} className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
              style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
            >
              {/* Matchup-Mark (weiss) sobald dieser Punkt vollständig ist */}
              <img src="/icon-192.png" alt="" className="h-4 w-4" style={{ filter: "brightness(0) invert(1)" }} />
            </span>
          ) : (
            <span className="text-sm font-extrabold text-white">{Math.round(p)}%</span>
          )}
        </div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-[11px] font-bold text-white/85">{label}</div>
        <div className="text-[10px] text-white/45">{value}</div>
      </div>
    </div>
  );
}

function StatusOverview({ plan, profile, hasRank, over, spentPct }: { plan: Tournament[]; profile: PlayerProfile; hasRank: boolean; over: boolean; spentPct: number }) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const reds = hasRank ? plan.map((t) => eligibility(profile, t).status).filter((s) => s === "red").length : 0;
  const miss = plan.length ? missingDocs(profile, plan[0]) : [];
  const reqCount = plan.length ? requiredDocs(plan[0]).length : 4;
  const docsOk = miss.length === 0;

  const rows: { label: string; value: string; pct: number; done: boolean }[] = [
    {
      label: tt("Teilnahme", "Eligibility"),
      value: !hasRank ? tt("Ranking fehlt", "Ranking missing") : reds === 0 ? tt("Alle möglich", "All eligible") : tt(`${reds} offen`, `${reds} open`),
      pct: !hasRank ? 6 : plan.length ? Math.round(((plan.length - reds) / plan.length) * 100) : 100,
      done: hasRank && reds === 0,
    },
    {
      label: tt("Unterlagen", "Documents"),
      value: docsOk ? tt("Vollständig", "Complete") : tt(`${miss.length}/${reqCount} fehlen`, `${miss.length}/${reqCount} missing`),
      pct: Math.round(((reqCount - miss.length) / reqCount) * 100),
      done: docsOk,
    },
    {
      label: tt("Budget", "Budget"),
      value: over ? tt("Über Budget", "Over budget") : tt("Ausreichend", "Sufficient"),
      pct: over ? 42 : 100,
      done: !over,
    },
  ];
  const ready = rows.filter((r) => r.done).length;

  return (
    <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{tt("Saison-Status", "Season status")}</span>
        <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-bold text-white/80 ring-1 ring-white/10">{ready} / 3 {tt("bereit", "ready")}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {rows.map((r, i) => (
          <StatusRing key={r.label} id={i} label={r.label} value={r.value} pct={r.pct} done={r.done} />
        ))}
      </div>
    </div>
  );
}

function ProjectionCard({ plan, profile }: { plan: Tournament[]; profile: PlayerProfile }) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const [open, setOpen] = useState(true);
  const [winPct, setWinPct] = useState(50); // frei einstellbare Siegquote
  const gender = profile.gender === "w" ? "w" : "m";
  const currentRank = gender === "w" ? profile.wta : profile.atp;

  const pts = projectSeasonPoints(plan, winPct / 100);
  const rank = pointsToRank(pts, gender);
  const bestPts = projectSeasonPoints(plan, 1);
  const bestRank = pointsToRank(bestPts, gender);

  return (
    <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M3 17l6-6 4 4 7-7" /><path d="M14 8h6v6" /></svg>
          {tt("Mögliches Ranking mit dieser Saison", "Possible ranking with this season")}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={open ? "rotate-180" : ""}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {currentRank != null && (
        <div className="mt-1 text-[11px] text-white/40">{tt("Aktuell", "Current")}: {gender === "w" ? "WTA" : "ATP"} {currentRank}</div>
      )}
      {open && (
        <div className="mt-2.5">
          {/* Ergebnis */}
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-white/50">{tt("Bei", "With")} <span className="text-emerald-400">{winPct}%</span> {tt("gewonnenen Matches", "of matches won")}</span>
            <span className="text-[11px] text-white/40">{pts.toLocaleString("de-CH")} {tt("P.", "pts")}</span>
          </div>
          <div className="mt-0.5 text-[26px] font-extrabold tracking-tight text-white">{tt("Rang", "Rank")} ~{rank}</div>

          {/* Schieberegler */}
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={winPct}
            onChange={(e) => setWinPct(Number(e.target.value))}
            className="mt-2 w-full accent-emerald-400"
          />
          <div className="flex justify-between text-[10px] text-white/40">
            <span>0 %</span>
            <span>50 %</span>
            <span>100 %</span>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2">
            <span className="text-[11px] font-semibold text-white/50">{tt("Maximal (alles gewinnen)", "Maximum (win everything)")}</span>
            <span className="text-sm font-extrabold text-emerald-400">{tt("Rang", "Rank")} ~{bestRank}</span>
          </div>

          <p className="pt-1.5 text-[10px] leading-relaxed text-white/35">
            {tt("Richtwert: beste 19 Turniere, erwartete Punkte je Siegquote (", "Estimate: best 19 tournaments, expected points per win rate (")}{gender === "w" ? "WTA" : "ATP"}{tt("-Kurve). Grobe Schätzung, kein offizieller Cut-Off.", " curve). Rough estimate, not an official cut-off.")}
          </p>
        </div>
      )}
    </div>
  );
}

function StrategyCard({ profile, setGroup }: { profile: PlayerProfile; setGroup: (g: (typeof GROUPS)[number]) => void }) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const s = strategyFor(profile);
  const [open, setOpen] = useState(false);

  // Eingeklappt: kompakter Chip (spart Platz). Aufgeklappt: volle Empfehlung.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-2 text-left ring-1 ring-white/10 transition hover:bg-white/[0.12]"
      >
        <TargetIcon className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white/80">
          <span className="text-emerald-400">{tt("Strategie:", "Strategy:")}</span> {s.headline} · {s.focus}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/40"><path d="M6 9l6 6 6-6" /></svg>
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
      <button type="button" onClick={() => setOpen(false)} className="flex w-full items-center justify-between gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
        <span className="flex items-center gap-1.5"><TargetIcon className="h-3.5 w-3.5 text-emerald-400" />{tt("Strategie für dich", "Strategy for you")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className="mt-1 text-sm font-bold text-white">{s.headline}</div>
      <div className="mt-0.5 text-sm font-semibold text-emerald-400">{s.focus}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/50">{s.note}</p>
      <button type="button" onClick={() => setGroup(s.group)} className="mt-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-900 transition hover:bg-white/90">
        {tt("Passende Turniere zeigen →", "Show matching tournaments →")}
      </button>
    </div>
  );
}

function readAvatar(file: File, cb: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const min = Math.min(img.width, img.height); // quadratischer Center-Crop
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      cb(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function AuthBlock({
  synced,
  email,
  onSignIn,
  onSignUp,
  onSignOut,
}: {
  synced: boolean;
  email: string | null;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  onSignOut: () => Promise<void>;
}) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const [mode, setMode] = useState<"in" | "up">("up");
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (synced) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="flex min-w-0 items-baseline gap-1 text-[12px] text-emerald-700">
          <span className="shrink-0">☁ {tt("Gesichert als", "Saved as")}</span>
          <b className="min-w-0 flex-1 truncate" title={email ?? undefined}>{email ?? tt("deinem Konto", "your account")}</b>
        </span>
        <button type="button" onClick={() => void onSignOut()} className="shrink-0 text-[11px] font-bold text-emerald-700 hover:underline">
          {tt("Abmelden", "Sign out")}
        </button>
      </div>
    );
  }

  const submit = async () => {
    if (!em || pw.length < 6) {
      setMsg({ ok: false, text: tt("E-Mail und Passwort (mind. 6 Zeichen) eingeben.", "Enter email and password (at least 6 characters).") });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = mode === "up" ? await onSignUp(em, pw) : await onSignIn(em, pw);
    setBusy(false);
    if (res.error) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    if (mode === "up" && "needsConfirm" in res && res.needsConfirm) {
      setMsg({ ok: true, text: tt("Fast fertig – bestätige den Link in deiner E-Mail, dann ist dein Profil gesichert.", "Almost done – confirm the link in your email, then your profile is saved.") });
      setPw("");
    }
    // Erfolg mit Session: onAuthStateChange schaltet automatisch auf „gesichert".
  };

  return (
    <div className="rounded-xl bg-indigo-50 p-3">
      <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-bold text-indigo-700">🔒 {tt("Profil mit Passwort sichern", "Secure profile with a password")}</div>
      <p className="mb-2 text-[11px] text-indigo-700/80">{tt("Dieselbe Anmeldung wie in der Matchup-App – danach ist dein Profil (inkl. Bild) auf allen Geräten verfügbar.", "The same login as in the Matchup app – your profile (incl. photo) is then available on all devices.")}</p>
      <div className="space-y-1.5">
        <input type="email" value={em} onChange={(e) => setEm(e.target.value)} placeholder={tt("E-Mail", "Email")} autoComplete="email" className="mu-in" />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={tt("Passwort", "Password")}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
          className="mu-in"
        />
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy}
        className="mt-2 w-full rounded-full bg-matchup px-3 py-2 text-xs font-bold text-white transition hover:bg-matchup-hover disabled:opacity-50"
      >
        {busy ? "…" : mode === "up" ? tt("Registrieren & sichern", "Register & save") : tt("Anmelden", "Sign in")}
      </button>
      <button
        type="button"
        onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(null); }}
        className="mt-1.5 block w-full text-center text-[11px] font-semibold text-indigo-700 hover:underline"
      >
        {mode === "up" ? tt("Ich habe schon ein Konto → Anmelden", "I already have an account → Sign in") : tt("Neu hier? → Konto erstellen", "New here? → Create account")}
      </button>
      {msg && <p className={`mt-1.5 text-[11px] ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}

function ProfileCard({
  profile,
  setProfile,
  synced,
  email,
  onSignIn,
  onSignUp,
  onSignOut,
}: {
  profile: PlayerProfile;
  setProfile: (p: PlayerProfile) => void;
  synced: boolean;
  email: string | null;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const set = <K extends keyof PlayerProfile>(k: K, v: PlayerProfile[K]) => setProfile({ ...profile, [k]: v });
  const setDoc = (k: keyof PlayerDocs, v: boolean) => setProfile({ ...profile, docs: { ...profile.docs, [k]: v } });
  const num = (v: string) => (v === "" ? null : Math.max(1, Math.round(Number(v)) || 0));
  const rankSummary = profile.atp ? `ATP ${profile.atp}` : profile.wta ? `WTA ${profile.wta}` : profile.itf ? `ITF ${profile.itf}` : tt("kein Ranking", "no ranking");
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || tt("Spielerprofil", "Player profile");
  const initials = (profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "");

  // Eingeklappt: Glas-Karte im Cockpit. Ausgeklappt: weisse Karte, damit das
  // Formular darunter lesbar bleibt.
  return (
    <div className={open ? "rounded-2xl bg-white" : "rounded-2xl bg-white/[0.07] ring-1 ring-white/10"}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-2.5 text-left">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className={`h-9 w-9 shrink-0 rounded-full object-cover ring-2 ${open ? "ring-neutral-100" : "ring-white/25"}`} />
        ) : (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-2 ${open ? "bg-matchup/10 text-matchup ring-neutral-100" : "bg-white/15 text-white ring-white/25"}`}>
            {initials || "👤"}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={`truncate text-sm font-bold ${open ? "" : "text-white"}`}>{name}</span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                open
                  ? synced ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                  : synced ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/50"
              }`}
              title={synced ? tt("Mit deinem Matchup-Konto synchronisiert – auf allen Geräten verfügbar", "Synced with your Matchup account – available on all devices") : tt("Lokal auf diesem Gerät gespeichert – mit Passwort sichern für geräteübergreifenden Sync", "Stored locally on this device – secure with a password for cross-device sync")}
            >
              {synced ? tt("☁ Konto", "☁ Account") : tt("Lokal", "Local")}
            </span>
          </span>
          <span className={`block text-xs ${open ? "text-neutral-400" : "text-white/50"}`}>{rankSummary}{profile.nationality ? ` · ${profile.nationality}` : ""}</span>
        </span>
        <span className={`text-xs font-semibold ${open ? "text-matchup" : "text-white/70"}`}>{open ? tt("Schliessen", "Close") : tt("Bearbeiten", "Edit")}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-neutral-100 p-3">
          <AuthBlock synced={synced} email={email} onSignIn={onSignIn} onSignUp={onSignUp} onSignOut={onSignOut} />

          {/* Profilbild */}
          <div className="flex items-center gap-3">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-neutral-200" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-base font-extrabold text-matchup">
                {initials || "👤"}
              </span>
            )}
            <div className="flex flex-1 flex-wrap gap-1.5">
              <label className="cursor-pointer rounded-full bg-matchup px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-matchup-hover">
                {profile.avatar ? tt("Bild ändern", "Change photo") : tt("Profilbild hochladen", "Upload profile photo")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readAvatar(f, (url) => set("avatar", url));
                    e.target.value = "";
                  }}
                />
              </label>
              {profile.avatar && (
                <button type="button" onClick={() => set("avatar", "")} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-200">
                  {tt("Entfernen", "Remove")}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label={tt("Vorname", "First name")}><input value={profile.firstName} onChange={(e) => set("firstName", e.target.value)} className="mu-in" /></Field>
            <Field label={tt("Nachname", "Last name")}><input value={profile.lastName} onChange={(e) => set("lastName", e.target.value)} className="mu-in" /></Field>
            <Field label={tt("Nationalität", "Nationality")}><input value={profile.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder={tt("z.B. Deutschland", "e.g. Germany")} className="mu-in" /></Field>
            <Field label={tt("Geburtsdatum", "Date of birth")}><input type="date" value={profile.birthdate} onChange={(e) => set("birthdate", e.target.value)} className="mu-in" /></Field>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">{tt("Geschlecht", "Gender")}</div>
            <div className="flex gap-1.5">
              <Chip active={profile.gender === "m"} onClick={() => set("gender", "m")}>{tt("Herren", "Men")}</Chip>
              <Chip active={profile.gender === "w"} onClick={() => set("gender", "w")}>{tt("Damen", "Women")}</Chip>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Field label="ATP"><input inputMode="numeric" value={profile.atp ?? ""} onChange={(e) => set("atp", num(e.target.value))} className="mu-in" /></Field>
            <Field label="WTA"><input inputMode="numeric" value={profile.wta ?? ""} onChange={(e) => set("wta", num(e.target.value))} className="mu-in" /></Field>
            <Field label="ITF"><input inputMode="numeric" value={profile.itf ?? ""} onChange={(e) => set("itf", num(e.target.value))} className="mu-in" /></Field>
            <Field label="UTR"><input inputMode="numeric" value={profile.utr ?? ""} onChange={(e) => set("utr", num(e.target.value))} className="mu-in" /></Field>
            <Field label="WTN"><input inputMode="numeric" value={profile.wtn ?? ""} onChange={(e) => set("wtn", num(e.target.value))} className="mu-in" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={tt("Heimatflughafen", "Home airport")}><input value={profile.homeAirport} onChange={(e) => set("homeAirport", e.target.value)} placeholder={tt("z.B. FRA", "e.g. FRA")} className="mu-in" /></Field>
            <Field label={tt("Wohnort", "Home city")}><input value={profile.homeCity} onChange={(e) => set("homeCity", e.target.value)} className="mu-in" /></Field>
          </div>
          <Field label={tt("Kontakt (für Trainingspartner)", "Contact (for practice partners)")}><input value={profile.contact} onChange={(e) => set("contact", e.target.value)} placeholder="@insta / WhatsApp-Nr. / E-Mail" className="mu-in" /></Field>
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">{tt("Dokumente (vorhanden abhaken)", "Documents (check off what you have)")}</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(DOC_LABELS) as (keyof PlayerDocs)[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDoc(k, !profile.docs[k])}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    profile.docs[k] ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {profile.docs[k] ? "✔ " : ""}{tt(DOC_LABELS[k], DOC_LABELS_EN[k])}
                </button>
              ))}
            </div>
          </div>
          <style>{`.mu-in{width:100%;border:1px solid #e5e7eb;border-radius:0.6rem;padding:0.4rem 0.6rem;font-size:0.85rem;outline:none}.mu-in:focus{border-color:#4b3bf3}`}</style>
        </div>
      )}
    </div>
  );
}

type Wx = { maxT: number; minT: number; rainDays: number } | "loading" | "err";
function useWeather(t: Tournament): Wx {
  const [wx, setWx] = useState<Wx>("loading");
  useEffect(() => {
    if (t.indoor) return;
    let cancel = false;
    setWx("loading");
    const y = Number(t.start.slice(0, 4)) - 1; // Vorjahres-Referenzzeitraum = Klimawert
    const s = `${y}${t.start.slice(4)}`;
    const e = `${y}${t.end.slice(4)}`;
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${t.lat}&longitude=${t.lng}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        const mx = ((d?.daily?.temperature_2m_max ?? []) as (number | null)[]).filter((v): v is number => v != null);
        const mn = ((d?.daily?.temperature_2m_min ?? []) as (number | null)[]).filter((v): v is number => v != null);
        const pr = ((d?.daily?.precipitation_sum ?? []) as (number | null)[]).filter((v): v is number => v != null);
        if (!mx.length) { setWx("err"); return; }
        const avg = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
        setWx({ maxT: avg(mx), minT: avg(mn.length ? mn : mx), rainDays: pr.filter((v) => v >= 1).length });
      })
      .catch(() => { if (!cancel) setWx("err"); });
    return () => { cancel = true; };
  }, [t.id, t.indoor, t.lat, t.lng, t.start, t.end]);
  return wx;
}

type LiveBundle = { hotel: LivePrice; flight: LivePrice };
function useLivePrices(stop: { city: string; country: string; start: string; end: string }, homeAirport?: string): LiveBundle {
  const [live, setLive] = useState<LiveBundle>({ hotel: { configured: false, price: null }, flight: { configured: false, price: null } });
  const key = `${stop.city}|${stop.start}|${homeAirport ?? ""}`;
  useEffect(() => {
    let cancel = false;
    setLive({ hotel: { configured: false, price: null }, flight: { configured: false, price: null } });
    Promise.all([hotelPriceQuery(stop), flightPriceQuery(stop, homeAirport)]).then(([hotel, flight]) => {
      if (!cancel) setLive({ hotel, flight });
    });
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return live;
}

type Poi = { name: string; lat: number; lng: number; dist: number };
type PoiCats = Record<"food" | "physio" | "fitness" | "stringer" | "pharmacy" | "supermarket", Poi[]>;
function useNearbyPOIs(t: Tournament): PoiCats | "loading" | "err" {
  const [state, setState] = useState<PoiCats | "loading" | "err">("loading");
  useEffect(() => {
    let cancel = false;
    setState("loading");
    fetch(`/api/pois?lat=${t.lat}&lng=${t.lng}`)
      .then((r) => r.json())
      .then((d) => { if (!cancel) setState(d?.categories ?? "err"); })
      .catch(() => { if (!cancel) setState("err"); });
    return () => { cancel = true; };
  }, [t.id, t.lat, t.lng]);
  return state;
}

const POI_META: { key: keyof PoiCats; icon: string; label: string }[] = [
  { key: "food", icon: "🍽️", label: "Restaurants & Cafés" },
  { key: "physio", icon: "🧑‍⚕️", label: "Physio" },
  { key: "stringer", icon: "🎾", label: "Besaitung & Sportgeschäft" },
  { key: "fitness", icon: "🏋️", label: "Fitness & Sportcenter" },
  { key: "supermarket", icon: "🛒", label: "Supermarkt" },
  { key: "pharmacy", icon: "💊", label: "Apotheke" },
];
function fmtDist(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}
function POINearby({ pois }: { pois: PoiCats | "loading" | "err" }) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  if (pois === "loading") return <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-400">{tt("Umgebung wird geladen …", "Loading surroundings …")}</div>;
  if (pois === "err") return <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400">{tt("Umgebungsdaten aktuell nicht verfügbar.", "Location data currently unavailable.")}</div>;
  const groups = POI_META.filter((m) => pois[m.key]?.length);
  if (!groups.length) return <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400">{tt("Keine Einträge im Umkreis gefunden.", "No entries found nearby.")}</div>;
  return (
    <div className="space-y-3">
      {groups.map((m) => (
        <div key={m.key}>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-neutral-500">
            <span>{m.icon}</span> {tt(m.label, POI_LABEL_EN[m.key] ?? m.label)}
          </div>
          <div className="space-y-1">
            {pois[m.key].slice(0, 4).map((p, i) => (
              <a
                key={i}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.lat},${p.lng}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 hover:border-matchup/40"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-700">{p.name}</span>
                <span className="shrink-0 text-[11px] font-semibold text-neutral-400">{fmtDist(p.dist)}</span>
                <span className="shrink-0 text-[11px] text-matchup">↗</span>
              </a>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-neutral-400">{tt("Umkreis ~3 km · Quelle: OpenStreetMap", "Within ~3 km · Source: OpenStreetMap")}</p>
    </div>
  );
}

function contactHref(c: string): string {
  const s = c.trim();
  if (/^https?:\/\//.test(s)) return s;
  if (s.startsWith("@")) return `https://instagram.com/${s.slice(1)}`;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return `mailto:${s}`;
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length >= 8) return `https://wa.me/${digits}`;
  return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
}
function nameInitials(name: string | null): string {
  return (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "🎾";
}
const PRES_INPUT = "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-matchup";

function PresenceSection({ t, profile, synced }: { t: Tournament; profile: PlayerProfile; synced: boolean }) {
  const { locale } = useLocale();
  const tt = (de: string, en: string) => (locale === "de" ? de : en);
  const [rows, setRows] = useState<Presence[] | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [looking, setLooking] = useState(true);
  const [contact, setContact] = useState(profile.contact || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(null);
    currentUserId().then(setUid);
    loadPresence(t.id).then(setRows);
  }, [t.id]);

  const me = uid ? (rows ?? []).find((r) => r.user_id === uid) ?? null : null;
  const others = (rows ?? []).filter((r) => r.user_id !== uid);
  useEffect(() => {
    if (me) { setLooking(me.looking); setContact(me.contact ?? ""); }
  }, [me?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => loadPresence(t.id).then(setRows);
  const join = async () => { if (!uid) return; setBusy(true); await joinPresence(uid, t.id, profile, looking, contact); await refresh(); setBusy(false); };
  const leave = async () => { if (!uid) return; setBusy(true); await leavePresence(uid, t.id); await refresh(); setBusy(false); };

  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">
        {tt("Wer ist hier?", "Who's here?")}{rows ? ` · ${rows.length}` : ""}
      </h3>

      {synced ? (
        <div className="rounded-2xl border border-matchup/20 bg-matchup/5 p-3">
          <div className="text-sm font-bold text-neutral-800">{me ? tt("✓ Du bist eingetragen", "✓ You're listed") : tt("Bist du diese Woche hier?", "Are you here this week?")}</div>
          <p className="mt-0.5 text-[11px] text-neutral-500">{tt("Trag dich ein, damit andere Spieler dich für gemeinsames Training finden.", "List yourself so other players can find you for training together.")}</p>
          <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={looking} onChange={(e) => setLooking(e.target.checked)} className="h-4 w-4 accent-matchup" />
            {tt("Trainingspartner gesucht", "Looking for a practice partner")}
          </label>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={tt("Kontakt (z.B. @insta / WhatsApp-Nr. / E-Mail)", "Contact (e.g. @insta / WhatsApp no. / email)")} className={`${PRES_INPUT} mt-2`} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={join} disabled={busy} className="flex-1 rounded-full bg-matchup px-3 py-2 text-xs font-bold text-white transition hover:bg-matchup-hover disabled:opacity-50">
              {busy ? "…" : me ? tt("Aktualisieren", "Update") : tt("Ich bin hier", "I'm here")}
            </button>
            {me && (
              <button type="button" onClick={leave} disabled={busy} className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-200 disabled:opacity-50">
                {tt("Austragen", "Remove me")}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-500">
          {tt("Melde dich oben im Profil an, um dich einzutragen und Trainingspartner vor Ort zu finden.", "Sign in via your profile above to list yourself and find practice partners on site.")}
        </div>
      )}

      {rows === null ? (
        <p className="mt-2 text-xs text-neutral-400">{tt("lädt …", "loading …")}</p>
      ) : others.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-400">{tt("Noch niemand eingetragen — sei der erste.", "No one listed yet — be the first.")}</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {others.map((r) => (
            <div key={r.user_id} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[11px] font-bold text-matchup">{nameInitials(r.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{r.name}</span>
                  {r.looking && <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">🎾 {tt("sucht Partner", "seeks partner")}</span>}
                </span>
                <span className="block truncate text-[11px] text-neutral-400">{[r.rank_label, r.nationality, r.surface && tt(SURFACE_LABEL[r.surface], SURFACE_LABEL_EN[r.surface])].filter(Boolean).join(" · ")}</span>
              </span>
              {r.contact && (
                <a href={contactHref(r.contact)} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-matchup px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-matchup-hover">{tt("Kontakt", "Contact")}</a>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-neutral-400">{tt("Community · Präsenz ist freiwillig und nur für angemeldete Spieler sichtbar.", "Community · presence is voluntary and only visible to signed-in players.")}</p>
    </div>
  );
}

const TRAVEL_ICON: Record<"hotel" | "flight" | "car", string> = {
  hotel: "M3 21h18M5 21V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-3a2 2 0 0 1 4 0v3",
  flight: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  car: "M5 11l1.6-4.3A2 2 0 0 1 8.5 5.4h7a2 2 0 0 1 1.9 1.3L19 11M4 11h16a1 1 0 0 1 1 1v4h-3M4 11a1 1 0 0 0-1 1v4h3m0 0a2 2 0 1 0 4 0m-4 0h4m4 0a2 2 0 1 0 4 0m-4 0h4",
};

function BookLink({ href, kind, label, sub, live = false }: { href: string; kind: "hotel" | "flight" | "car"; label: string; sub: string; live?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border bg-white px-2 py-3 text-center transition hover:shadow-sm ${
        live ? "border-matchup/40" : "border-neutral-200 hover:border-matchup/40"
      }`}
    >
      {live && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" title="Live-Preis" />
      )}
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-matchup/10 text-matchup">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={TRAVEL_ICON[kind]} /></svg>
      </span>
      <span className="text-xs font-bold text-neutral-700">{label}</span>
      <span className={`w-full truncate text-[10px] ${live ? "font-bold text-matchup" : "text-neutral-400"}`}>{sub}</span>
    </a>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

/* dark = auf dem dunklen Planer-Grund; ohne = im weissen Profil-Formular. */
function Chip({ children, active, onClick, subtle = false, dark = false }: { children: ReactNode; active: boolean; onClick: () => void; subtle?: boolean; dark?: boolean }) {
  const cls = dark
    ? active
      ? "bg-white text-neutral-900"
      : "bg-white/[0.07] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12]"
    : active
      ? subtle ? "bg-neutral-900 text-white" : "bg-matchup text-white shadow-sm"
      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}
