"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import TourLoginCard from "@/app/tour/components/TourLoginCard";
import { COUNTRY_CODES } from "@/lib/i18n/messages/tour";
import { loadPlannerProfile, loadActiveTournaments, tournamentsInFrame, placeKey, ratesToCostParams, budgetMoney, buildSeasonCandidates, costRatesComplete, saveHome, type PlannerProfile, type Frame } from "@/lib/tourPlanner";
import { loadSeasonTournamentIds, addToSeason, removeFromSeason, loadSeasonPlanRows, loadAllEntryEvents } from "@/lib/tourSeason";
import { alternateTrend } from "@/domain/tour/entryTrend";
import { loadReminderSettings, saveReminderSettings } from "@/lib/tourReminders";
import { saveWhoAmI, saveSeasonBudget } from "@/lib/tourSetup";
import { loadCostRates, type CostRatesPatch } from "@/lib/tourCosts";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import { loadPlayerDocs, type PlayerDocs } from "@/lib/tourPlayerMaster";
import { documentWarnings } from "@/domain/tour/documentWarnings";
import { visaLeadWarnings } from "@/domain/tour/visaLeadWarnings";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import type { TourTravelDocument } from "@/lib/types";
import { loadResultHistory, toMatchResults, type ResultHistoryRow } from "@/lib/tourResultHistory";
import { pointsForecast } from "@/domain/tour/pointsForecast";
import { loadWildcardContacts, type TourWildcardContact } from "@/lib/tourWildcards";
import { buildActionBoard, type BoardTournament } from "@/domain/tour/actionBoard";
import MorningBoard from "./MorningBoard";
import { computeSeasonCost } from "@/domain/tour/costs";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { optimizeSeason, type SeasonObjective } from "@/domain/tour/optimizeSeason";
import { expectedPoints, type PointsRound } from "@/domain/tour/points";
import { schengenUsage, isSchengenCode, type Stay, type SchengenUsage } from "@/domain/tour/schengen";
import CostRatesForm from "@/app/tour/costs/components/CostRatesForm";
import { DeadlineCountdown } from "../EntryDeadline";
import type { TourTournament, TourCostRates, TourSeasonPlanEntry, TourEntryEvent } from "@/lib/types";
import PlannerMap, { type PlanStop, type CandPoint, type MapStart } from "./PlannerMap";
import TournamentDetail from "./TournamentDetail";
import InfoHint from "./InfoHint";
import { geocodeCity, type GeoHit } from "@/lib/geocode";
import { HOME_BASES } from "@/lib/tournaments";

const DAY = 86_400_000;
const NIGHTS_KEY = "mu_tour_nights";

/** Beobachtungen nach plan_id gruppieren (für den Trend je Saisoneintrag). */
function groupEventsByPlan(evs: TourEntryEvent[]): Map<string, TourEntryEvent[]> {
  const m = new Map<string, TourEntryEvent[]>();
  for (const e of evs) { const a = m.get(e.plan_id); if (a) a.push(e); else m.set(e.plan_id, [e]); }
  return m;
}
// Optimierer-Objektiv (v3): „meiste Turniere" (Standard) vs. „meiste erwartete Punkte".
// Beim Umschalten auf Punkte ist die Zielrunde nie leer — Vorgabe R16 (2. Runde).
const OBJECTIVE_KEY = "mu_tour_objective";
const EXP_ROUND_KEY = "mu_tour_exp_round";
const EXP_ROUND_DEFAULT: PointsRound = "R16";
const ROUND_OPTS: PointsRound[] = ["W", "F", "SF", "QF", "R16", "R32"];

/**
 * Saisonplaner unter /tour — EINE Fläche nach dem Vorbild des /map-SeasonPlanners.
 *
 * ETAPPE 2: Profil (Anzeige + Ranking, aufklappbar), Startpunkt-SUCHE mit Stadtvorschlägen
 * aus den Turnierorten, und der Rahmen mit LÄNDER-MEHRFACHAUSWAHL inklusive Turnierzahl je
 * Land (wie die Filter in /tour/browse) + Schnellwahl Europa/alle. Die Nationalität steuert
 * über tourVisaRequirements, welche Länder überhaupt infrage kommen (gesperrte fliegen aus
 * dem Katalog). Alles reaktiv. Kostensätze/Smart-Fill/Kosten + Detail folgen in Etappe 3–5.
 */
const byMonday = (a: TourTournament, b: TourTournament) => a.tournament_monday.localeCompare(b.tournament_monday);
const hasCoords = (t: TourTournament) => t.latitude != null && t.longitude != null;
const RECENT_KEY = "mu_tour_recent_starts";
// Katalogspalten-Breite (Desktop): Anzeigevorliebe, kein Datum → localStorage. Default 380
// (schmaler als früher: die Filter haben jetzt eine EIGENE Spalte). Clamp [320, min(560, 42%)].
// Der alte Schlüssel mu_tour_panel_w bleibt unberührt liegen (andere Semantik).
const LEFT_W_KEY = "mu_tour_left_w";
const LEFT_W_DEFAULT = 380;
const LEFT_W_MIN = 320;
function clampLeftW(w: number): number {
  const max = typeof window !== "undefined" ? Math.max(LEFT_W_MIN, Math.min(560, Math.floor(window.innerWidth * 0.42))) : 520;
  return Math.min(max, Math.max(LEFT_W_MIN, Math.round(w)));
}
const FILTERS_OPEN_KEY = "mu_tour_filters_open";
// Feste Breiten der Filter-/Detailspalte (Desktop, inline). Nur die Katalogspalte ist
// zieh-verstellbar (ein einziger Breiten-Schlüssel laut Entwurf).
const FILTER_W = 296;
const DETAIL_W = 400;
// Responsive Schwellen (px). Drop-Reihenfolge bei schmalerem Fenster: Filter → Detail →
// Katalog; die KARTE fällt nie weg. Ab BP_FOUR steht die Filterspalte inline (schiebt),
// ab BP_DETAIL die Detailspalte inline; darunter werden beide zu Overlays.
const BP_FOUR = 1520;
const BP_DETAIL = 1200;
const BP_MOBILE = 1024;

export default function SeasonWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [tours, setTours] = useState<TourTournament[]>([]);
  const [seasonIds, setSeasonIds] = useState<Set<string>>(new Set());
  const [banned, setBanned] = useState<Set<string>>(new Set());
  // Dokument-Stammdaten (Pass-/Versicherungs-Ablauf) für die Ablaufwarnungen im Fristen-Block.
  const [docs, setDocs] = useState<PlayerDocs | null>(null);
  // Für das Morgen-Dashboard: erfasste Ergebnisse (Punktestand/Verfall) + Wildcard-Anfragen.
  const [resultHistory, setResultHistory] = useState<ResultHistoryRow[]>([]);
  const [wildcards, setWildcards] = useState<TourWildcardContact[]>([]);
  const [travelDocs, setTravelDocs] = useState<TourTravelDocument[]>([]);
  // Entry-Status je Turnier (Planzeile) + Beobachtungs-Verlauf je Planzeile — für die
  // Status-Pills + Trend in der Saisonliste und den Editor im Detail.
  const [planByTour, setPlanByTour] = useState<Map<string, TourSeasonPlanEntry>>(new Map());
  const [eventsByPlan, setEventsByPlan] = useState<Map<string, TourEntryEvent[]>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(true);

  // Profil (aufklappbar) + Ranking-Bearbeitung.
  const [profileOpen, setProfileOpen] = useState(false);
  // Kurze Rückmeldung, wenn ein neuer Wohnort das Wohnland ändert (steuert Visa-Warnungen).
  const [homeCountryMsg, setHomeCountryMsg] = useState<string | null>(null);
  const [rankingInput, setRankingInput] = useState("");

  // Startpunkt: Suche + gewählter Startpunkt (Session; überschreibt das Profil für die Route).
  const [startPick, setStartPick] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [locQuery, setLocQuery] = useState("");
  const [recent, setRecent] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [geoResults, setGeoResults] = useState<GeoHit[]>([]);

  // Rahmen (Budget, Zeitraum, Region/Länder). Länder-Dropdown-Zustand.
  const [frame, setFrame] = useState<Frame>(() => ({ region: "europe", from: new Date().toISOString().slice(0, 10), to: "", countries: [] }));
  // Standard-Startdatum (heute bei Mount) — Bezug für den „Zeitraum"-Chip (nur bei Abweichung).
  // Als State (einmal initialisiert) statt Ref: im Render lesbar, ohne Purity-Verstoß.
  const [defaultFrom] = useState(() => frame.from);
  const [budget, setBudget] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryBoxRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);

  // Etappe 3: Kostensätze, Nächte-Annahme, Schengen-Aufenthalte, Smart-Fill-Zustand.
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [nights, setNights] = useState<string>(() => { try { return localStorage.getItem(NIGHTS_KEY) ?? ""; } catch { return ""; } });
  // Optimierer-Objektiv + angenommene Zielrunde (Erwartungspunkte). SSR-stabile Defaults,
  // danach aus localStorage. Die Runde ist nie leer → Vorgabe R16 (Entscheidung 3: kein
  // stiller Objektiv-Rückfall — die Vorgabe verhindert, dass expectedRound leer ankommt).
  const [objective, setObjective] = useState<SeasonObjective>("most_tournaments");
  const [expRound, setExpRound] = useState<PointsRound>(EXP_ROUND_DEFAULT);
  useEffect(() => {
    try {
      const o = localStorage.getItem(OBJECTIVE_KEY);
      if (o === "most_points" || o === "most_tournaments") setObjective(o);
      const r = localStorage.getItem(EXP_ROUND_KEY);
      if (r && (ROUND_OPTS as string[]).includes(r)) setExpRound(r as PointsRound);
    } catch { /* egal */ }
  }, []);
  const chooseObjective = useCallback((o: SeasonObjective) => { setObjective(o); try { localStorage.setItem(OBJECTIVE_KEY, o); } catch { /* egal */ } }, []);
  const chooseRound = useCallback((r: PointsRound) => { setExpRound(r); try { localStorage.setItem(EXP_ROUND_KEY, r); } catch { /* egal */ } }, []);
  // Katalogspalten-Breite (Desktop): SSR-stabiler Default, danach aus localStorage übernehmen
  // (vermeidet Hydration-Mismatch am inline width). Der Zieh-Griff sitzt zwischen Katalog
  // und Karte. Beim Ziehen wird die Filterspalten-Breite mitgerechnet (Griff-x minus Offset).
  const [leftW, setLeftW] = useState(LEFT_W_DEFAULT);
  useEffect(() => {
    try { const v = parseInt(localStorage.getItem(LEFT_W_KEY) ?? "", 10); if (Number.isFinite(v)) setLeftW(clampLeftW(v)); } catch { /* egal */ }
  }, []);
  // Filterspalte auf-/zugeklappt (Anzeigevorliebe → localStorage). Standard: zu.
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { try { setFiltersOpen(localStorage.getItem(FILTERS_OPEN_KEY) === "1"); } catch { /* egal */ } }, []);
  const toggleFilters = useCallback(() => setFiltersOpen((o) => { const n = !o; try { localStorage.setItem(FILTERS_OPEN_KEY, n ? "1" : "0"); } catch { /* egal */ } return n; }), []);
  // Filterspalte öffnen UND ans Budget-Feld springen (Chip/Hinweis führen hierher — das
  // Budget ist die zweitwichtigste Eingabe, es soll nicht hinter einem zugeklappten Filter liegen).
  const openBudget = useCallback(() => {
    setFiltersOpen(true);
    try { localStorage.setItem(FILTERS_OPEN_KEY, "1"); } catch { /* egal */ }
    requestAnimationFrame(() => requestAnimationFrame(() => { budgetRef.current?.scrollIntoView({ block: "center" }); budgetRef.current?.focus(); }));
  }, []);
  // Fensterbreite steuert, welche Spalten inline stehen und welche zu Overlays werden.
  // SSR-stabiler Default (Desktop-Annahme), danach gemessen + auf resize aktualisiert.
  const [winW, setWinW] = useState(1440);
  useEffect(() => {
    const on = () => setWinW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  function startLeftDrag(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    // Offset der linken Kante der Katalogspalte (0 oder Filterspaltenbreite, wenn sie inline steht).
    const filterInline = window.innerWidth >= BP_FOUR && filtersOpen;
    const offset = filterInline ? FILTER_W : 0;
    let last = leftW;
    const onMove = (ev: MouseEvent) => { last = clampLeftW(ev.clientX - offset); setLeftW(last); };
    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try { localStorage.setItem(LEFT_W_KEY, String(last)); } catch { /* egal */ }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  // Fristen-Erinnerungen (E-Mail): Schalter im Profil. Vorgabe an; beim Umschalten wird die
  // aktuelle UI-Sprache mitgespeichert, damit die Mail sie trifft.
  const [reminderEnabled, setReminderEnabled] = useState(true);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    loadReminderSettings(user.id).then((s) => { if (alive) setReminderEnabled(s.enabled); }).catch(() => { /* egal — Vorgabe an */ });
    return () => { alive = false; };
  }, [user]);
  const toggleReminders = useCallback((next: boolean) => {
    if (!user) return;
    setReminderEnabled(next); // optimistisch
    void saveReminderSettings(user.id, next, locale === "en" ? "en" : "de").catch(() => setReminderEnabled(!next));
  }, [user, locale]);

  // Plan-Rows (Status/Position/Gebühr) + Verlauf neu laden — nach Toggle, Füllen, Speichern.
  const reloadEntries = useCallback(async () => {
    if (!user) return;
    try {
      const [rows, evs] = await Promise.all([loadSeasonPlanRows(), loadAllEntryEvents()]);
      setPlanByTour(new Map(rows.map((r) => [r.tournament_id, r])));
      setEventsByPlan(groupEventsByPlan(evs));
    } catch { /* egal — Pills bleiben beim letzten Stand */ }
  }, [user]);

  const [stays, setStays] = useState<Stay[]>([]);
  const [filling, setFilling] = useState(false);
  // MU-037: Rückmeldung nach dem Füllen. reason erklärt, WARUM nichts dazukam.
  const [fillReport, setFillReport] = useState<{ added: number; occupied: number; reason: "added" | "weeks_full" | "budget" | "no_candidates" } | null>(null);
  const [costOpen, setCostOpen] = useState(false); // Kostensätze/Nächte bearbeiten (aufklappbar, wenn Sätze schon da sind)
  const [nowMs] = useState(() => Date.now()); // Stichtag für den Meldefrist-Countdown (aus der Komponente)

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [p, ts, ids, cr, planRows, evs, pdocs, rhist, wcs, tdocs] = await Promise.all([
          loadPlannerProfile(user.id), loadActiveTournaments(), loadSeasonTournamentIds(), loadCostRates(), loadSeasonPlanRows(), loadAllEntryEvents(), loadPlayerDocs(user.id), loadResultHistory(user.id), loadWildcardContacts(user.id), loadTravelDocuments(user.id),
        ]);
        if (!alive) return;
        setTravelDocs(tdocs);
        setProfile(p);
        setTours(ts);
        setSeasonIds(ids);
        setPlanByTour(new Map(planRows.map((r) => [r.tournament_id, r])));
        setEventsByPlan(groupEventsByPlan(evs));
        setRates(cr);
        setDocs(pdocs);
        setResultHistory(rhist);
        setWildcards(wcs);
        setRankingInput(p.ranking != null ? String(p.ranking) : "");
        setBudget(p.seasonBudget != null ? String(p.seasonBudget) : "");
        setStatus("ready");
        // Einreisesperren + Schengen-Aufenthalte hängen an den Pässen und werden REAKTIV
        // in eigenen Effekten geladen (unten) — so wirkt eine Pass-Änderung sofort.
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); if (Array.isArray(r)) setRecent(r.slice(0, 5)); } catch { /* egal */ }
  }, []);

  const byId = useMemo(() => new Map(tours.map((x) => [x.id, x])), [tours]);
  const fmtDay = useCallback((iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z")), [locale]);
  const catName = useCallback((c: string | null) => (c ? (t(`tour.country.${c}`).startsWith("tour.country.") ? c : t(`tour.country.${c}`)) : "—"), [t]);

  // ── Wohnort-/Startpunkt-Suche: ECHTE Städteliste über den Geocoder (Nominatim-Proxy),
  //    nicht mehr aus dem Turnierkatalog — ein Wohnort ist selten ein Turnierort. Entprellt
  //    (~400 ms nach Tippende), nicht pro Tastendruck (Nominatim-Richtlinie). Land-Bias aus
  //    dem Profil. ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = locQuery.trim();
    if (q.length < 3) { setGeoResults([]); return; }
    const cc = profile?.country ?? undefined;
    const id = window.setTimeout(() => { void geocodeCity(q, cc).then(setGeoResults); }, 400);
    return () => window.clearTimeout(id);
  }, [locQuery, profile?.country]);

  const pickStart = useCallback((c: { name: string; lat: number; lng: number }) => {
    setStartPick(c);
    setLocQuery("");
    setRecent((cur) => {
      const next = [c, ...cur.filter((x) => x.name !== c.name)].slice(0, 5);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* egal */ }
      return next;
    });
  }, []);

  const start: MapStart = useMemo(() => {
    if (startPick) return { lat: startPick.lat, lng: startPick.lng };
    if (profile?.lat != null && profile?.lng != null) return { lat: profile.lat, lng: profile.lng };
    return null;
  }, [startPick, profile]);
  const startName = startPick?.name ?? profile?.city ?? null;

  // Saison in Reisereihenfolge, mit fortlaufender Nummer.
  const seasonOrdered = useMemo(() => {
    const list = [...seasonIds].map((id) => byId.get(id)).filter((x): x is TourTournament => !!x).sort(byMonday);
    return list.map((tt, i) => ({ tt, order: i + 1 }));
  }, [seasonIds, byId]);
  const planStops: PlanStop[] = useMemo(
    () => seasonOrdered.filter((s) => hasCoords(s.tt)).map((s) => ({ id: s.tt.id, lat: s.tt.latitude as number, lng: s.tt.longitude as number, order: s.order })),
    [seasonOrdered],
  );
  // Wählbare Turniere auf der Karte: im Rahmen, MIT Koordinaten, NICHT gesperrt, NICHT
  // schon in der Saison. Als geclusterte GL-Ebene (Viewport-Culling in PlannerMap).
  const candidateStops: CandPoint[] = useMemo(
    () => tournamentsInFrame(tours, frame)
      .filter((tt) => hasCoords(tt) && !(tt.country && banned.has(tt.country)) && !seasonIds.has(tt.id))
      .map((tt) => ({ id: tt.id, lat: tt.latitude as number, lng: tt.longitude as number })),
    [tours, frame, banned, seasonIds],
  );

  // ── Turnier-Zahl je Land im ZEITRAUM (für die Länder-Mehrfachauswahl) ──────────
  const countByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const tt of tours) {
      if (!tt.country) continue;
      if (frame.from && tt.tournament_monday < frame.from) continue;
      if (frame.to && tt.tournament_monday > frame.to) continue;
      m.set(tt.country, (m.get(tt.country) ?? 0) + 1);
    }
    return m;
  }, [tours, frame.from, frame.to]);
  const countryList = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    return [...countByCountry.entries()]
      .filter(([iso]) => !q || catName(iso).toLowerCase().includes(q) || iso.toLowerCase().includes(q))
      .sort((a, b) => b[1] - a[1] || catName(a[0]).localeCompare(catName(b[0]), locale));
  }, [countByCountry, countryQuery, catName, locale]);

  // ── Katalog: im Rahmen, OHNE gesperrte Länder (Nationalität), nach Ort gruppiert ──
  const catalog = useMemo(() => {
    const inFrame = tournamentsInFrame(tours, frame).filter((tt) => !(tt.country && banned.has(tt.country)));
    const groups = new Map<string, TourTournament[]>();
    for (const tt of inFrame) {
      const k = placeKey(tt.country, tt.city) ?? tt.id;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(tt);
    }
    const clusters: { key: string; place: string; country: string | null; items: TourTournament[] }[] = [];
    const singles: TourTournament[] = [];
    for (const [k, items] of groups) {
      items.sort(byMonday);
      if (items.length >= 3) clusters.push({ key: k, place: items[0].city ?? t("tour.fieldMissing"), country: items[0].country, items });
      else singles.push(...items);
    }
    clusters.sort((a, b) => a.items[0].tournament_monday.localeCompare(b.items[0].tournament_monday));
    singles.sort(byMonday);
    return { clusters, singles, total: inFrame.length };
  }, [tours, frame, banned, t]);

  const toggle = useCallback((id: string) => {
    if (!user) return;
    const inSeason = seasonIds.has(id);
    const next = new Set(seasonIds);
    if (inSeason) next.delete(id); else next.add(id);
    setSeasonIds(next);
    (inSeason ? removeFromSeason(id) : addToSeason(user.id, id))
      .then(() => reloadEntries()) // Planzeile/planId für die neue Auswahl nachladen
      .catch(() => {
        setSeasonIds((cur) => { const rb = new Set(cur); if (inSeason) rb.add(id); else rb.delete(id); return rb; });
      });
  }, [user, seasonIds, reloadEntries]);

  // ── Etappe 3: reaktive Kosten & Status ─────────────────────────────────────────
  // Nächte-Annahme (localStorage): leer → 7 (Domain-Default), sonst die Eingabe.
  const nightsNum = useMemo(() => { const n = parseInt(nights.trim(), 10); return Number.isFinite(n) && n >= 0 ? n : 7; }, [nights]);
  useEffect(() => { try { if (nights.trim() === "") localStorage.removeItem(NIGHTS_KEY); else localStorage.setItem(NIGHTS_KEY, nights.trim()); } catch { /* egal */ } }, [nights]);

  // Unterliegt die Nationalität der Schengen-90/180-Regel? (kein Schengen-Pass → ja)
  const schengenApplies = useMemo(() => !!profile && profile.passports.length > 0 && !hasSchengenPassport(profile.passports), [profile]);

  // Einreisesperren REAKTIV zu den Pässen: gesperrte Länder fliegen aus dem Katalog. Ein
  // stabiler String-Schlüssel als Dep, damit nur echte Pass-Änderungen neu laden.
  const passportsKey = (profile?.passports ?? []).join(",");
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const ps = passportsKey ? passportsKey.split(",") : [];
    bannedDestinations(ps).then((b) => { if (alive) setBanned(b); }).catch(() => { /* egal */ });
    return () => { alive = false; };
  }, [user, passportsKey]);

  // Schengen-Aufenthalte nur laden, wenn die Nationalität der 90/180-Regel unterliegt.
  useEffect(() => {
    if (!user || !schengenApplies) return; // nicht betroffen → stays bleibt ungenutzt (schengen=null)
    let alive = true;
    loadStays(user.id).then((rows) => { if (alive) setStays(rows.filter((s) => s.confirmed).map((s) => ({ country: s.country, entry: s.entry_date, exit: s.exit_date }))); }).catch(() => { /* egal */ });
    return () => { alive = false; };
  }, [user, schengenApplies]);

  // Kosten als Reisekette über die GEPLANTE Saison (nur wenn alle Pflicht-Sätze da sind).
  const cost = useMemo(() => {
    if (!costRatesComplete(rates)) return null;
    const params = ratesToCostParams(rates!);
    const stations = seasonOrdered.map(({ tt }) => ({ place: placeKey(tt.country, tt.city) ?? `id:${tt.id}`, nights: nightsNum, entryFee: null }));
    return computeSeasonCost(stations, params);
  }, [rates, seasonOrdered, nightsNum]);

  // Nächste noch offene Meldefrist über die geplante Saison (für die Übersichtsspalte).
  const nextDeadline = useMemo(() => {
    let best: { tt: TourTournament; ms: number } | null = null;
    for (const { tt } of seasonOrdered) {
      const dl = tourDeadlines(new Date(tt.tournament_monday + "T00:00:00Z"), tt.series);
      const ms = dl.entry ? dl.entry.getTime() : null;
      if (ms == null || ms < nowMs) continue;
      if (!best || ms < best.ms) best = { tt, ms };
    }
    return best?.tt ?? null;
  }, [seasonOrdered, nowMs]);

  // Dokument-Ablaufwarnungen (Pass/Versicherung) — gehören in die Dringlichkeits-Klasse der
  // nächsten Frist. Die nächste anstehende Reise = das nächste Fristen-Turnier (Zielland +
  // Turniermontag als Einreise-Näherung) speist die 6-Monats-FAUSTREGEL.
  const docWarnings = useMemo(() => {
    if (!docs) return [];
    const nextTrip = nextDeadline ? { destination: nextDeadline.country, entryDate: nextDeadline.tournament_monday } : null;
    return documentWarnings({
      passports: [
        { country: docs.passport_country, expiry: docs.passport_expiry },
        { country: docs.passport2_country, expiry: docs.passport2_expiry },
      ],
      insurance: { expiry: docs.insurance_expiry, international: docs.insurance_international },
      nextTrip,
      asOf: new Date(nowMs).toISOString().slice(0, 10),
    });
  }, [docs, nextDeadline, nowMs]);

  // Erwartete Punkte der geplanten Saison unter der Annahme-Runde (nur Objektiv „Punkte").
  // anyPoints=false heißt: mit dieser Runde bringt kein Turnier Punkte (z. B. R32/1. Runde).
  const expPoints = useMemo(() => {
    if (objective !== "most_points") return null;
    let sum = 0;
    let anyPoints = false;
    for (const { tt } of seasonOrdered) {
      const p = expectedPoints(tt.category, expRound, tt.tournament_monday).points;
      sum += p;
      if (p > 0) anyPoints = true;
    }
    return { sum, anyPoints };
  }, [objective, expRound, seasonOrdered]);

  // Budget der Kostensatz-Währung (Minor) für den Balken.
  const budgetMinor = useMemo(() => {
    const cur = rates?.currency ?? "EUR";
    const raw = budget.trim().replace(",", ".");
    const n = raw === "" ? (profile?.seasonBudget ?? null) : Number(raw);
    if (n == null || !Number.isFinite(n) || n < 0) return null;
    return budgetMoney(Math.round(n), cur);
  }, [rates?.currency, budget, profile?.seasonBudget]);

  // Schengen-Auslastung: bestehende Aufenthalte + die Schengen-Turniere der Saison.
  const schengen: SchengenUsage | null = useMemo(() => {
    if (!schengenApplies) return null;
    const asOf = new Date(nowMs).toISOString().slice(0, 10);
    const seasonStays: Stay[] = seasonOrdered
      .filter(({ tt }) => tt.country && isSchengenCode(tt.country))
      .map(({ tt }) => {
        const entry = tt.tournament_monday;
        const exit = new Date(Date.parse(entry + "T00:00:00Z") + nightsNum * DAY).toISOString().slice(0, 10);
        return { country: tt.country as string, entry, exit };
      });
    return schengenUsage([...stays, ...seasonStays], asOf);
  }, [schengenApplies, seasonOrdered, stays, nightsNum, nowMs]);

  // Kostensätze gespeichert → in den lokalen Zustand übernehmen (reaktiv, ohne Reload).
  const onRatesSaved = useCallback((patch: CostRatesPatch) => {
    setRates((r) => ({
      user_id: r?.user_id ?? user?.id ?? "",
      arrival_minor: patch.arrival_minor,
      per_night_minor: patch.per_night_minor,
      food_per_day_minor: patch.food_per_day_minor,
      coach_per_week_minor: patch.coach_per_week_minor,
      currency: patch.currency,
      created_at: r?.created_at ?? "",
      updated_at: r?.updated_at ?? "",
    }));
  }, [user]);

  // „Günstigste Saison füllen": ruft den Optimierer und SETZT die Saison (Startpunkt,
  // danach von Hand änderbar — nicht ein Ergebnis, das man annimmt). Ersetzt die
  // bisherige Saison (Diff-Persistenz gegen tour_season_plan).
  const smartFill = useCallback(async () => {
    if (!user || filling || !costRatesComplete(rates)) return;
    setFilling(true);
    try {
      const params = ratesToCostParams(rates!);
      const cur = rates!.currency ?? "EUR";
      const raw = budget.trim().replace(",", ".");
      const budgetVal = raw === "" ? (profile?.seasonBudget ?? null) : Number(raw);
      const budgetM = budgetVal != null && Number.isFinite(budgetVal) && budgetVal >= 0 ? budgetMoney(Math.round(budgetVal), cur) : null;
      const homePlace = placeKey(profile?.country ?? null, profile?.city ?? null) ?? "";
      // MU-037 — ERGÄNZEN, NIE ERSETZEN. Der Knopf heißt „füllen", nicht „ersetzen":
      // (1) Wochen mit bestehendem Saison-Eintrag fallen als blockedWeeks aus den
      //     Kandidaten (buildSeasonCandidates blockt sie) → der Optimierer schlägt nur
      //     freie Wochen vor und kollidiert nie mit Handgeplantem.
      // (2) Gefüllt wird nur ins RESTBUDGET (Budget minus bereits verplante Kosten),
      //     damit die Ergänzung das Budget nicht sprengt.
      // (3) Persistiert wird ausschließlich ein INSERT je neuem Turnier — kein einziges
      //     removeFromSeason. Ein Klick kann eine geplante Saison damit nicht mehr löschen.
      const blockedWeeks = new Set<string>();
      for (const id of seasonIds) { const tt = tours.find((x) => x.id === id); if (tt?.tournament_monday) blockedWeeks.add(tt.tournament_monday); }
      const spentMinor = cost ? (cost.total[cur] ?? 0) : 0;
      const remainingM = budgetM ? { amount: Math.max(0, budgetM.amount - spentMinor), currency: cur } : null;
      const candidates = buildSeasonCandidates(tours, frame, blockedWeeks, seasonIds);
      const result = optimizeSeason({
        candidates,
        budget: remainingM,
        params,
        homePlace,
        nightsPerWeek: nights.trim() === "" ? null : nightsNum,
        now: new Date(),
        schengen: schengenApplies ? { applies: true, existingStays: stays } : null,
        entryBanned: banned,
        objective,
        expectedRound: objective === "most_points" ? expRound : null,
      });
      const picks = result.picks.filter((p) => !seasonIds.has(p.id)); // doppelte Sicherung: nie Bestehendes
      if (picks.length > 0) {
        const next = new Set(seasonIds);
        picks.forEach((p) => next.add(p.id));
        setSeasonIds(next); // optimistisch — NUR hinzufügen
        await Promise.all(picks.map((p) => addToSeason(user.id, p.id)));
        await reloadEntries(); // Planzeilen der neu gefüllten Turniere nachladen
      }
      // Grund für „nichts ergänzt" unterscheiden: alle Wochen belegt · Budget erschöpft ·
      // keine Kandidaten im Rahmen. (Bei added>0 ist reason egal.)
      let reason: "added" | "weeks_full" | "budget" | "no_candidates" = "added";
      if (picks.length === 0) {
        if (candidates.length === 0) reason = blockedWeeks.size > 0 ? "weeks_full" : "no_candidates";
        else if ((remainingM != null && remainingM.amount <= 0) || result.rejected.some((r) => r.reasons.some((x) => x.code === "budget_erschoepft"))) reason = "budget";
        else reason = "no_candidates";
      }
      setFillReport({ added: picks.length, occupied: blockedWeeks.size, reason });
    } catch {
      // Bei Fehler den echten Stand zurückholen, damit Anzeige und DB nicht auseinanderlaufen.
      try { setSeasonIds(await loadSeasonTournamentIds()); } catch { /* egal */ }
    } finally {
      setFilling(false);
    }
  }, [user, filling, rates, budget, profile, tours, frame, nights, nightsNum, schengenApplies, stays, banned, seasonIds, cost, objective, expRound, reloadEntries]);

  const money = useCallback((minor: number, cur: string) => new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100), [locale]);

  // Budget entprellt persistieren.
  useEffect(() => {
    if (status !== "ready" || !user) return;
    const raw = budget.trim().replace(",", ".");
    const n = raw === "" ? null : Number(raw);
    const value = n != null && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    if (value === (profile?.seasonBudget ?? null)) return;
    const id = window.setTimeout(() => { void saveSeasonBudget(user.id, value); }, 700);
    return () => window.clearTimeout(id);
  }, [budget, status, user, profile?.seasonBudget]);

  const saveRanking = useCallback(() => {
    if (!user) return;
    const n = parseInt(rankingInput.trim(), 10);
    const value = Number.isFinite(n) && n > 0 ? n : null;
    void saveWhoAmI(user.id, { ranking: value }).then(() => setProfile((p) => (p ? { ...p, ranking: value } : p)));
  }, [user, rankingInput]);

  // Wohnland kommt aus dem /app-Profil (profiles.country/country_name) und wird im
  // Identitäts-Block nur ANGEZEIGT (übernommen) — Ändern über /app bzw. den Startpunkt.
  // Pässe (tour_profiles.passports) — Nationalität. Ändert Katalog-Sperren + Schengen
  // (beides hängt REAKTIV an passportsKey/schengenApplies, siehe Effekte oben).
  const setPassports = useCallback((next: string[]) => {
    if (!user) return;
    setProfile((p) => (p ? { ...p, passports: next } : p)); // optimistisch → Effekte laden neu
    void saveWhoAmI(user.id, { passports: next });
  }, [user]);

  // Kartenauswahl: auf dem Handy zusätzlich das Bottom-Sheet öffnen, sonst bliebe das
  // Detail hinter dem eingeklappten Sheet verborgen. Stabile Referenz (Setter sind stabil).
  const handleSelect = useCallback((id: string) => { setSelectedId(id); setSheetOpen(true); }, []);

  // Wohnort aus der Einführung ins Profil schreiben (nur wenn er fehlt). Von hier aus
  // rechnet der Planer Anreise + Kosten je Turnierwoche → Einblendung verschwindet danach.
  const pickHome = useCallback((c: { city: string; country: string | null; lat: number; lng: number }) => {
    if (!user) return;
    // Neu gewählter Wohnort ÜBERNIMMT das Land aus dem Geocoder (c.country) — der kennt es
    // genauer als ein evtl. alter/falscher Profilwert. Fehlt das Geocoder-Land (kuratierte
    // Schnellwahl ohne Land), bleibt das bisherige. Startpunkt-Suche (pickStart) ist davon
    // getrennt und schreibt NIE ein Land — nur pickHome (Onboarding) setzt das Wohnland.
    const country = c.country ?? profile?.country ?? null;
    const changed = country != null && country !== (profile?.country ?? null);
    void saveHome(user.id, c.city, country, c.lat, c.lng);
    setProfile((p) => (p ? { ...p, city: c.city, country, lat: c.lat, lng: c.lng } : p));
    setLocQuery("");
    // NICHT still: sichtbar machen, dass sich das Wohnland (→ Visa-Warnungen) geändert hat.
    if (changed) { setHomeCountryMsg(catName(country)); window.setTimeout(() => setHomeCountryMsg(null), 6000); }
  }, [user, profile?.country, catName]);

  // Außenklick/Escape schließt das Länder-Dropdown.
  useEffect(() => {
    if (!countryOpen) return;
    const onDoc = (e: MouseEvent) => { if (countryBoxRef.current && !countryBoxRef.current.contains(e.target as Node)) setCountryOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setCountryOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [countryOpen]);

  const selCountries = frame.countries ?? [];
  const toggleCountry = (iso: string) => setFrame((f) => {
    const cur = new Set(f.countries ?? []);
    if (cur.has(iso)) cur.delete(iso); else cur.add(iso);
    return { ...f, countries: [...cur] };
  });

  // Serie/Belag (Mehrfachauswahl). Leere Auswahl = kein Filter (siehe matchesFrameKind).
  const SERIES_OPTS: { v: string; label: string }[] = [
    { v: "itf_wtt", label: t("tour.seriesItf") },
    { v: "challenger", label: t("tour.seriesChallenger") },
  ];
  const SURFACE_OPTS = ["clay", "hard", "grass", "carpet"] as const;
  const selSeries = frame.series ?? [];
  const selSurface = frame.surface ?? [];
  const toggleSeries = (v: string) => setFrame((f) => {
    const cur = new Set(f.series ?? []); if (cur.has(v)) cur.delete(v); else cur.add(v); return { ...f, series: [...cur] };
  });
  const toggleSurface = (v: string) => setFrame((f) => {
    const cur = new Set(f.surface ?? []); if (cur.has(v)) cur.delete(v); else cur.add(v); return { ...f, surface: [...cur] };
  });
  // Zähler für das Badge am Filter-Knopf: konkrete, gesetzte Filter-Facetten.
  const activeFilters = selSeries.length + selSurface.length + selCountries.length + (frame.to ? 1 : 0) + (frame.region !== "europe" && selCountries.length === 0 ? 1 : 0);
  const resetFilters = () => setFrame((f) => ({ ...f, region: "europe", countries: [], series: [], surface: [], to: "" }));

  // ── Morgen-Dashboard: alle schon berechneten Modul-Ausgaben zur Ampel bündeln (reine Domain).
  //    MUSS vor den Auth-/Ladegattern stehen (Hook-Regeln: kein bedingtes useMemo). Budget wird
  //    hier aus cost/budgetMinor abgeleitet, weil die späteren cur/budgetLeftMinor erst nach den
  //    Gattern deklariert sind.
  const board = useMemo(() => {
    const asOf = new Date(nowMs).toISOString().slice(0, 10);
    const curc = rates?.currency ?? "EUR";
    const spent = cost ? (cost.total[curc] ?? 0) : 0;
    const budgetLeft = budgetMinor ? budgetMinor.amount - spent : null;
    const tournaments: BoardTournament[] = seasonOrdered.map(({ tt }) => {
      const plan = planByTour.get(tt.id);
      const events = plan ? eventsByPlan.get(plan.id) ?? [] : [];
      return {
        id: tt.id, city: tt.city, country: tt.country, monday: tt.tournament_monday, series: tt.series,
        status: plan?.status ?? "planned", alternatePosition: plan?.alternate_position ?? null,
        feePaid: plan?.fee_paid ?? false, decision: plan?.decision ?? null, inactive: tt.valid_to != null,
        alternateObs: events.map((e) => ({ observedAt: e.observed_at, alternatePosition: e.alternate_position })),
      };
    });
    // Punkte aus der erfassten Historie (Verfall via pointsForecast → nutzt points.ts).
    const f = pointsForecast(toMatchResults(resultHistory), asOf);
    const soon4 = f.steps.find((s) => s.weeks === 4)?.expiring[0] ?? null;
    const points = resultHistory.length
      ? {
          total: f.currentTotal,
          nextExpiry: f.schedule[0] ? { date: f.schedule[0].expiresOn, points: f.schedule[0].points } : null,
          expiringSoon: soon4 ? { date: soon4.expiresOn, points: soon4.points } : null,
        }
      : null;
    // Vorlaufzeit-Warnungen: je Saison-Turnier ein passendes Dokument (Bereich) mit
    // gesetzter Nutzer-Vorlaufzeit, das noch fehlt und dessen Antrag knapp wird.
    const visaLead = visaLeadWarnings({
      asOf,
      tournaments: seasonOrdered.map(({ tt }) => ({ id: tt.id, city: tt.city, country: tt.country, monday: tt.tournament_monday })),
      docs: travelDocs.map((d) => ({ scope: d.scope, status: d.status, valid_until: d.valid_until, lead_weeks: d.lead_weeks })),
    });
    return buildActionBoard({
      asOf,
      tournaments,
      banned: [...banned],
      docWarnings,
      schengen: schengen ? { exceeds: schengen.exceeds, used: schengen.used, left: schengen.left } : null,
      points,
      wildcards: wildcards.map((wc) => ({ tournamentName: byId.get(wc.tournament_id)?.city ?? "—", tournamentId: wc.tournament_id, requestedOn: wc.requested_on, outcome: wc.outcome })),
      budgetOver: budgetLeft != null && budgetLeft < 0 ? { amountMinor: -budgetLeft, currency: curc } : null,
      visaLead,
    });
  }, [nowMs, rates, cost, budgetMinor, seasonOrdered, planByTour, eventsByPlan, resultHistory, banned, docWarnings, schengen, wildcards, byId, travelDocs]);

  // ── Auth-Gate ────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-neutral-500">{t("tour.loading")}</div>;
  // Anmeldemaske direkt in /tour (dieselbe Supabase-Anmeldung → geteilte Sitzung), statt
  // nach /app zu verweisen. Das Weiterleiten wirkte wie eine Sackgasse.
  if (!user) return <TourLoginCard />;

  const inp = "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

  const catalogRow = (tt: TourTournament) => {
    const inSeason = seasonIds.has(tt.id);
    const sel = selectedId === tt.id;
    return (
      <div key={tt.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${sel ? "bg-matchup/[0.06] ring-1 ring-matchup/40" : "hover:bg-black/[0.02]"}`}>
        <button type="button" onClick={() => setSelectedId(tt.id)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-[13px] font-semibold text-neutral-900">{tt.city || t("tour.fieldMissing")}<span className="text-neutral-400">, {catName(tt.country)}</span></p>
          <p className="text-[11px] text-neutral-500">{fmtDay(tt.tournament_monday)} · {tt.category || "—"}</p>
        </button>
        <button type="button" onClick={() => toggle(tt.id)} aria-label={inSeason ? t("tour.seasonRemove") : t("tour.seasonAdd")}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-colors ${inSeason ? "bg-emerald-500/10 text-emerald-600" : "bg-matchup/10 text-matchup hover:bg-matchup/20"}`}>
          {inSeason ? "✓" : "+"}
        </button>
      </div>
    );
  };

  // Status-Pill je Saisoneintrag. 'planned' (Default aus Optimierer/„Füllen") erzeugt KEIN
  // Pill — kein Rauschen. Bei Alternate: Position + Trend-Marker aus dem Verlauf (entryTrend
  // setzt die zwei Regeln um: kein Marker bei einer Beobachtung; Datum statt Pfeil, wenn die
  // letzte Beobachtung zu alt ist).
  const asOfDate = new Date(nowMs).toISOString().slice(0, 10);
  const entryPill = (tt: TourTournament) => {
    const plan = planByTour.get(tt.id);
    const status = plan?.status ?? "planned";
    if (status === "planned") return null;
    const pos = plan?.alternate_position ?? null;
    const cls = status === "main_draw" || status === "entered" || status === "qualifying" || status === "confirmed" ? "bg-emerald-500/10 text-emerald-700"
      : status === "alternate" ? "bg-amber-500/10 text-amber-700"
      : status === "withdrawn" || status === "cancelled" ? "bg-black/[0.05] text-neutral-500 line-through"
      : "bg-black/[0.05] text-neutral-600";
    const word = `${t(`tour.status_${status}`)}${status === "alternate" && pos != null ? ` #${pos}` : ""}`;
    // Trend nur bei Alternate.
    const events = plan ? (eventsByPlan.get(plan.id) ?? []) : [];
    const trend = status === "alternate"
      ? alternateTrend(events.map((e) => ({ observedAt: e.observed_at, alternatePosition: e.alternate_position })), asOfDate)
      : { kind: "none" as const };
    return (
      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${cls}`}>{word}</span>
        {trend.kind === "up" && <span className="text-[11px] font-bold text-emerald-600" title={t("tour.wsTrendUp", { n: trend.delta })}>↑</span>}
        {trend.kind === "down" && <span className="text-[11px] font-bold text-amber-600" title={t("tour.wsTrendDown", { n: -trend.delta })}>↓</span>}
        {trend.kind === "flat" && <span className="text-[11px] font-bold text-neutral-400" title={t("tour.wsTrendFlat")}>•</span>}
        {trend.kind === "stale" && <span className="text-[10.5px] text-neutral-400">{t("tour.wsEntryAsOf", { date: fmtDay(trend.observedAt) })}</span>}
      </span>
    );
  };

  // Anzeigewerte für die Kosten-Sektion (reine Ableitungen, keine Systemzeit).
  const ratesDone = costRatesComplete(rates);
  const cur = rates?.currency ?? "EUR";
  const weekCostMinor = ratesDone ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nightsNum + (rates!.food_per_day_minor ?? 0) * nightsNum + (rates!.coach_per_week_minor ?? 0) : 0;
  const spentMinor = cost ? (cost.total[cur] ?? 0) : 0;
  const budgetLeftMinor = budgetMinor ? budgetMinor.amount - spentMinor : null;
  const budgetPct = budgetMinor && budgetMinor.amount > 0 ? Math.min(100, Math.round((spentMinor / budgetMinor.amount) * 100)) : 0;

  // Profil-Editor (Ranking/Wohnland/Pässe) — liegt jetzt in der Chip-Überlagerung, nicht mehr im Panel.
  const profileEditor = profile && (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.rankLabel")}</span>
        <div className="flex gap-2">
          <input value={rankingInput} onChange={(e) => setRankingInput(e.target.value)} inputMode="numeric" placeholder="—" className={inp} />
          <button type="button" onClick={saveRanking} className="shrink-0 rounded-xl bg-neutral-900 px-4 text-[13px] font-bold text-white hover:bg-neutral-700">{t("common.save")}</button>
        </div>
      </label>
      <div>
        <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.wsPassports")}</span>
        {profile.passports.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {profile.passports.map((iso) => (
              <button key={iso} type="button" onClick={() => setPassports(profile.passports.filter((p) => p !== iso))} className="flex items-center gap-1 rounded-full bg-matchup/10 px-2.5 py-1 text-[12px] font-semibold text-matchup">
                {catName(iso)} <span className="text-matchup/60">✕</span>
              </button>
            ))}
          </div>
        )}
        <select value="" onChange={(e) => { if (e.target.value) setPassports([...profile.passports, e.target.value]); }} className={inp}>
          <option value="">{t("tour.wsAddPassport")}</option>
          {COUNTRY_CODES.filter((c) => !profile.passports.includes(c)).map((c) => <option key={c} value={c}>{catName(c)}</option>)}
        </select>
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-400">{t("tour.wsProfileNote")}</p>

      {/* Fristen-Erinnerungen per E-Mail — Vorgabe an, jederzeit abschaltbar. */}
      <div className="border-t border-black/[0.06] pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold text-neutral-700">{t("tour.wsRemindersLabel")}</span>
          <button type="button" role="switch" aria-checked={reminderEnabled} onClick={() => toggleReminders(!reminderEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${reminderEnabled ? "bg-matchup" : "bg-black/15"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${reminderEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsRemindersHint")}</p>
      </div>
    </div>
  );

  // Eingeloggt, aber keine web.profiles-Zeile: /tour zeigt sonst leere Felder ohne Erklärung
  // (und Speichern schlägt still fehl, weil das Update 0 Zeilen trifft). Stattdessen ein klarer
  // Hinweis mit Weg ins /app-Onboarding, das die Zeile UND die Identität (Name/Foto/Land) anlegt.
  const noProfileHint = (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-matchup/10 text-[20px]" aria-hidden>👤</div>
      <h3 className="mt-2 text-[15px] font-extrabold text-neutral-900">{t("tour.npTitle")}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">{t("tour.npBody")}</p>
      <Link href="/app" className="mt-3 inline-flex rounded-full bg-matchup px-6 py-2.5 text-[13px] font-bold text-white hover:bg-matchup-hover">{t("tour.npCta")}</Link>
    </div>
  );

  // ── Detailelement (Reiter). key=tt.id → beim Wechsel neu gemountet (Live-Preis genau
  //    einmal je Turnier). Wird in der Detailspalte ODER als Overlay gezeigt. ──────────
  const selectedTt = selectedId ? byId.get(selectedId) : undefined;
  const detailEl = selectedTt ? (
    <TournamentDetail
      key={selectedTt.id}
      tt={selectedTt}
      countryName={catName(selectedTt.country)}
      inSeason={seasonIds.has(selectedTt.id)}
      onToggle={() => toggle(selectedTt.id)}
      onClose={() => setSelectedId(null)}
      originCity={startName}
      originLabel={startName}
      nights={nightsNum}
      rates={rates}
      nowMs={nowMs}
      viewerId={user.id}
      viewerName={profile?.firstName ?? null}
      viewerRank={profile?.ranking != null ? `#${profile.ranking}` : null}
      viewerNationality={profile?.passports[0] ?? profile?.country ?? null}
      viewerPassports={profile?.passports ?? []}
      planId={planByTour.get(selectedTt.id)?.id ?? null}
      entryStatus={planByTour.get(selectedTt.id)?.status ?? "planned"}
      alternatePosition={planByTour.get(selectedTt.id)?.alternate_position ?? null}
      feePaid={planByTour.get(selectedTt.id)?.fee_paid ?? false}
      entryEvents={eventsByPlan.get(planByTour.get(selectedTt.id)?.id ?? "") ?? []}
      onEntryChanged={reloadEntries}
    />
  ) : null;

  // Kostensätze fehlen → aus dem Katalog heraus die Filterspalte + das Formular öffnen.
  const openRates = () => { setCostOpen(true); setFiltersOpen(true); try { localStorage.setItem(FILTERS_OPEN_KEY, "1"); } catch { /* egal */ } };

  // ── SPALTE 1: Filter (Serie · Belag · Region · Länder · Zeitraum · Budget · Kostensätze) ──
  const filterPanel = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-500">{t("tour.wsFilters")}{activeFilters > 0 ? ` · ${activeFilters}` : ""}</h2>
        <div className="flex items-center gap-1">
          {activeFilters > 0 && <button type="button" onClick={resetFilters} className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-neutral-500 hover:bg-black/[0.04]">{t("tour.wsFiltersReset")}</button>}
          <button type="button" onClick={toggleFilters} className="flex h-7 w-7 items-center justify-center rounded-full text-[16px] text-neutral-500 hover:bg-black/[0.05]" aria-label={t("common.close")}>✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {/* Optimierungsziel: steuert „Füllen". Bei „Punkte" erscheint die angenommene Zielrunde. */}
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.wsObjectiveTitle")}</span>
          <div className="flex flex-wrap gap-1.5">
            {([["most_tournaments", "wsObjTournaments"], ["most_points", "wsObjPoints"]] as const).map(([v, key]) => (
              <button key={v} type="button" onClick={() => chooseObjective(v)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${objective === v ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t(`tour.${key}`)}</button>
            ))}
          </div>
          {objective === "most_points" && (
            <div className="mt-2.5">
              <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.wsRoundLabel")}</span>
              <div className="flex flex-wrap gap-1.5">
                {ROUND_OPTS.map((r) => (
                  <button key={r} type="button" onClick={() => chooseRound(r)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${expRound === r ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t(`tour.round_${r}`)}</button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsRoundHint")}</p>
            </div>
          )}
        </div>
        {/* Serie */}
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.series")}</span>
          <div className="flex flex-wrap gap-1.5">
            {SERIES_OPTS.map((o) => {
              const on = selSeries.includes(o.v);
              return <button key={o.v} type="button" onClick={() => toggleSeries(o.v)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${on ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{o.label}</button>;
            })}
          </div>
        </div>
        {/* Belag */}
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.surfaceLabel")}</span>
          <div className="flex flex-wrap gap-1.5">
            {SURFACE_OPTS.map((s) => {
              const on = selSurface.includes(s);
              return <button key={s} type="button" onClick={() => toggleSurface(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${on ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t(`tour.surface_${s}`)}</button>;
            })}
          </div>
        </div>
        {/* Region + Länder-Mehrfachauswahl mit Turnierzahl je Land */}
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.plRegion")}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setFrame((f) => ({ ...f, region: "all", countries: [] }))} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${selCountries.length === 0 && frame.region === "all" ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t("tour.plRegionAll")}</button>
            <button type="button" onClick={() => setFrame((f) => ({ ...f, region: "europe", countries: [] }))} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${selCountries.length === 0 && frame.region === "europe" ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t("tour.plRegionEurope")}</button>
            <div className="relative" ref={countryBoxRef}>
              <button type="button" onClick={() => setCountryOpen((o) => !o)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${selCountries.length ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>
                {selCountries.length ? t("tour.wsCountriesN", { n: selCountries.length }) : t("tour.wsCountries")}
                <span className={`transition-transform ${countryOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {countryOpen && (
                <div className="absolute left-0 z-30 mt-1.5 w-72 rounded-2xl border border-black/10 bg-white p-2 shadow-xl">
                  <input value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder={t("tour.wsCountrySearch")} className={`${inp} mb-2`} autoFocus />
                  <div className="max-h-64 overflow-auto">
                    {countryList.map(([iso, n]) => {
                      const on = selCountries.includes(iso);
                      return (
                        <button key={iso} type="button" onClick={() => toggleCountry(iso)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-black/[0.03]">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${on ? "border-matchup bg-matchup text-white" : "border-neutral-300 text-transparent"}`}>✓</span>
                          <span className="min-w-0 flex-1 truncate text-neutral-800">{catName(iso)}</span>
                          <span className="shrink-0 tabular-nums text-[12px] font-semibold text-neutral-400">{n}</span>
                        </button>
                      );
                    })}
                    {countryList.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-neutral-400">{t("tour.opt.emptyNoTournaments")}</p>}
                  </div>
                  {selCountries.length > 0 && (
                    <button type="button" onClick={() => setFrame((f) => ({ ...f, countries: [] }))} className="mt-2 w-full rounded-lg bg-black/[0.03] py-1.5 text-[12px] font-semibold text-neutral-600 hover:bg-black/[0.06]">{t("tour.wsCountriesClear")}</button>
                  )}
                </div>
              )}
            </div>
          </div>
          {selCountries.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selCountries.map((iso) => (
                <button key={iso} type="button" onClick={() => toggleCountry(iso)} className="flex items-center gap-1 rounded-full bg-matchup/10 px-2.5 py-1 text-[12px] font-semibold text-matchup">
                  {catName(iso)} <span className="text-matchup/60">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Zeitraum */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plFrom")}</span>
            <input type="date" value={frame.from} onChange={(e) => setFrame((f) => ({ ...f, from: e.target.value }))} className={inp} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plTo")}</span>
            <input type="date" value={frame.to} onChange={(e) => setFrame((f) => ({ ...f, to: e.target.value }))} className={inp} /></label>
        </div>
        {/* Budget */}
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plBudget")}</span>
          <input ref={budgetRef} value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" placeholder="—" className={inp} />
          {budget.trim() === "" && <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsBudgetHint")}</p>}
        </label>
        {/* Kostensätze */}
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.wsCostTitle")}
            <InfoHint label={t("tour.wsCostInfo")}>
              {ratesDone && <p>{t("tour.wsWeekCost", { amount: money(weekCostMinor, cur) })}</p>}
              {cost && cost.arrivalsSaved > 0 && <p className="mt-1 text-emerald-600">{t("tour.wsArrivalsSaved", { n: cost.arrivalsSaved })}</p>}
              {cost && cost.hasUnknown && <p className="mt-1">{t("tour.wsCostUnknown")}</p>}
              <p className="mt-1">{t("tour.wsCostSource")}</p>
            </InfoHint>
          </span>
          {!ratesDone && !costOpen && (
            <button type="button" onClick={() => setCostOpen(true)} className="w-full rounded-xl bg-black/[0.03] px-3 py-2 text-left text-[12px] font-semibold text-matchup hover:bg-black/[0.06]">{t("tour.wsCostNeedRates")}</button>
          )}
          {ratesDone && !costOpen && (
            <button type="button" onClick={() => setCostOpen(true)} className="w-full rounded-xl bg-black/[0.03] px-3 py-2 text-left text-[12px] font-semibold text-matchup hover:bg-black/[0.06]">{t("tour.wsEditRates")}</button>
          )}
          {costOpen && <CostRatesForm rates={rates} userId={user.id} onSaved={onRatesSaved} nights={nights} onNightsChange={setNights} />}
        </div>
      </div>
    </div>
  );

  // ── Aktive-Filter-Chips: je vom STANDARD abweichender Filter EIN Chip mit x. Region
  //    (Europa-Standard bzw. „alle Länder") und leeres Budget erzeugen KEINEN Chip. Das x
  //    setzt genau diesen Filter zurück, OHNE die Filterspalte zu öffnen → Katalog/Karte/
  //    Optimierer reagieren sofort (reaktiv über frame/budget). Viele Länder → EIN Chip
  //    „N Länder", dessen x alle zurücksetzt (nicht zwölf Chips). ──────────────────────────
  const fmtChipDate = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const fromChanged = frame.from !== defaultFrom;
  const dateActive = fromChanged || frame.to !== "";
  const dateLabel = frame.to && fromChanged
    ? `${fmtChipDate(frame.from)} – ${fmtChipDate(frame.to)}`
    : frame.to ? t("tour.wsChipUntil", { date: fmtChipDate(frame.to) })
    : fromChanged ? t("tour.wsChipFrom", { date: fmtChipDate(frame.from) })
    : "";
  const budgetNum = Number(budget.trim().replace(",", "."));
  const budgetLabel = Number.isFinite(budgetNum) && budget.trim() !== "" ? `${t("tour.plBudget")} ${money(Math.round(budgetNum) * 100, cur)}` : t("tour.plBudget");
  const clearCountries = () => setFrame((f) => ({ ...f, countries: [] }));
  const activeChips: { key: string; label: string; onRemove: () => void; open?: () => void }[] = [
    ...selSeries.map((v) => ({ key: `series-${v}`, label: SERIES_OPTS.find((o) => o.v === v)?.label ?? v, onRemove: () => toggleSeries(v) })),
    ...selSurface.map((s) => ({ key: `surface-${s}`, label: t(`tour.surface_${s}`), onRemove: () => toggleSurface(s) })),
    ...(selCountries.length === 1
      ? [{ key: "country", label: catName(selCountries[0]), onRemove: clearCountries }]
      : selCountries.length > 1
        ? [{ key: "countries", label: t("tour.wsCountriesN", { n: selCountries.length }), onRemove: clearCountries }]
        : []),
    ...(dateActive ? [{ key: "date", label: dateLabel, onRemove: () => setFrame((f) => ({ ...f, from: defaultFrom, to: "" })) }] : []),
    ...(budget.trim() !== "" ? [{ key: "budget", label: budgetLabel, onRemove: () => setBudget(""), open: openBudget }] : []),
  ];
  const filterBar = (
    <div className="flex items-center gap-2">
      {/* Chips in EINER Zeile mit waagerechtem Scrollen (kein Umbruch → schiebt den Katalog
          nicht nach unten). Kein Chip → nur ein unsichtbarer Platzhalter, keine leere Zeile. */}
      {activeChips.length > 0 ? (
        <div className="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto">
          {activeChips.map((chip) => (
            <span key={chip.key} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/[0.05] py-1 pl-2.5 pr-1 text-[11px] font-semibold text-neutral-600">
              <button type="button" onClick={chip.open ?? toggleFilters} className="max-w-[9rem] truncate hover:text-neutral-900">{chip.label}</button>
              <button type="button" onClick={chip.onRemove} aria-label={t("tour.wsChipRemove", { label: chip.label })} className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-black/[0.08] hover:text-neutral-700">✕</button>
            </span>
          ))}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      {/* Kein Budget gesetzt → kein Chip, sondern ein Hinweis mit Weg zum Feld. */}
      {budget.trim() === "" && (
        <button type="button" onClick={openBudget} className="flex shrink-0 items-center gap-1 rounded-full bg-black/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500 hover:bg-black/[0.08] hover:text-neutral-800">
          <span aria-hidden>＋</span> {t("tour.wsBudgetSet")}
        </button>
      )}
      <button type="button" onClick={toggleFilters} className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ${filtersOpen ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>
        <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        {t("tour.wsFilters")}
        {activeFilters > 0 && <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${filtersOpen ? "bg-white/25 text-white" : "bg-matchup text-white"}`}>{activeFilters}</span>}
      </button>
    </div>
  );

  // ── SPALTE 4 (bzw. eingefaltet): Saison-Übersicht — Kosten & Status, Schengen, Frist ──
  const overviewSection = (
    <div className="space-y-5">
      {/* Morgen-Dashboard: die Fünf-Minuten-Übersicht. Sitzt hier, weil diese Spalte genau dann
          erscheint, wenn KEIN Turnier gewählt ist — das ist, was man beim Öffnen zuerst sieht.
          Ersetzt die früheren Einzel-Widgets (Nächste Frist / Doc-Warnungen / Schengen-Banner);
          die stecken jetzt konsolidiert in HANDLUNGSBEDARF (keine Doppelung). */}
      <MorningBoard board={board} onOpen={setSelectedId} countryName={catName} fmtDate={fmtDay} money={money} />

      <section className="space-y-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          {t("tour.wsCostTitle")}
          <InfoHint label={t("tour.wsCostInfo")}>
            {ratesDone && <p>{t("tour.wsWeekCost", { amount: money(weekCostMinor, cur) })}</p>}
            {ratesDone && <button type="button" onClick={openRates} className="mt-1 font-semibold text-matchup hover:underline">{t("tour.wsEditRates")}</button>}
            {cost && cost.arrivalsSaved > 0 && <p className="mt-1 text-emerald-600">{t("tour.wsArrivalsSaved", { n: cost.arrivalsSaved })}</p>}
            {cost && cost.hasUnknown && <p className="mt-1">{t("tour.wsCostUnknown")}</p>}
            {schengen && !schengen.exceeds && <p className="mt-1">{t("tour.wsSchengen", { used: schengen.used })} · {t("tour.wsSchengenLeft", { n: schengen.left })}</p>}
            <p className="mt-1">{t("tour.wsCostSource")}</p>
          </InfoHint>
        </h2>
        {ratesDone && cost && cost.stations.length > 0 ? (
          <div className="rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold text-neutral-500">{t("tour.wsCostTotal")}</span>
              <span className="text-[15px] font-extrabold tabular-nums text-neutral-900">{cost.currencies.map((c) => money(cost.total[c], c)).join(" + ")}</span>
            </div>
            {budgetMinor && (
              <div className="mt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                  <div className={`h-full rounded-full ${budgetLeftMinor != null && budgetLeftMinor < 0 ? "bg-amber-500" : "bg-matchup"}`} style={{ width: `${budgetPct}%` }} />
                </div>
                <p className={`mt-1 text-[12px] font-semibold ${budgetLeftMinor != null && budgetLeftMinor < 0 ? "text-amber-700" : "text-neutral-500"}`}>
                  {budgetLeftMinor != null && budgetLeftMinor < 0 ? t("tour.wsBudgetOver", { amount: money(-budgetLeftMinor, cur) }) : t("tour.wsBudgetLeft", { amount: money(budgetLeftMinor ?? 0, cur) })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-black/[0.02] px-4 py-3 text-[12px] leading-relaxed text-neutral-500">{t("tour.wsOverviewHint")}</p>
        )}
      </section>

      {/* Erwartete Punkte (nur Objektiv „Punkte") — sichtbar als Annahme markiert. */}
      {objective === "most_points" && expPoints && seasonOrdered.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsExpPointsTitle")}</h2>
          {expPoints.anyPoints ? (
            <p className="mt-2 rounded-2xl bg-black/[0.02] p-4 text-[13px] font-semibold text-neutral-800 ring-1 ring-black/5">
              {t("tour.wsExpPointsSum", { sum: expPoints.sum, round: t(`tour.round_${expRound}`) })}
            </p>
          ) : (
            <p className="mt-2 rounded-2xl border border-amber-300 bg-amber-500/10 p-3 text-[12px] leading-relaxed text-amber-800">{t("tour.wsExpPointsZero")}</p>
          )}
        </section>
      )}
    </div>
  );

  // ── SPALTE 2: Katalog — Rahmen-Kurzfassung/Filter-Knopf, Start, Füllen, (ggf. Übersicht),
  //    Saison, Turnierkatalog. Der Scroll-Body wird auch im Mobile-Sheet verwendet. ────────
  const foldOverview = winW < BP_DETAIL; // Detailspalte fällt weg → Übersicht faltet hier ein
  const catalogScroll = (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
      {status === "loading" && <p className="text-sm text-neutral-500">{t("tour.loading")}</p>}
      {status === "error" && <p className="text-sm text-neutral-500">{t("tour.loadError")}</p>}

      {status === "ready" && profile && (
        <>
          {filterBar}

          {/* Startpunkt: Suche + Chips */}
          <section>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsStartTitle")}</h2>
            <div className="relative mt-2">
              <input value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder={startName ? t("tour.wsStartCurrent", { name: startName }) : t("tour.wsStartSearch")} className={inp} />
              {geoResults.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">
                  {geoResults.map((c, i) => (
                    <li key={`${c.country}|${c.name}|${i}`}>
                      <button type="button" onClick={() => pickStart({ name: c.name, lat: c.lat, lng: c.lng })} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03]">
                        <span className="truncate font-semibold text-neutral-900">{c.name}</span>
                        <span className="shrink-0 text-[11px] text-neutral-400">{catName(c.country)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HOME_BASES.map((b) => (
                <button key={b.name} type="button" onClick={() => pickStart({ name: b.name, lat: b.lat, lng: b.lng })} className={`rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${startName === b.name ? "bg-emerald-500/10 text-emerald-700 ring-emerald-200" : "bg-white text-neutral-600 ring-black/10 hover:bg-black/[0.03]"}`}>
                  {b.name}
                </button>
              ))}
              {recent.filter((r) => !HOME_BASES.some((b) => b.name === r.name)).map((r) => (
                <button key={r.name} type="button" onClick={() => pickStart(r)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${startName === r.name ? "bg-emerald-500/10 text-emerald-700 ring-emerald-200" : "bg-white text-neutral-600 ring-black/10 hover:bg-black/[0.03]"}`}>
                  {r.name}
                </button>
              ))}
            </div>
          </section>

          {/* Füllen (ergänzt, ersetzt nie — MU-037). Kostensätze liegen im Filter. */}
          <section className="space-y-2">
            <button type="button" onClick={smartFill} disabled={filling || !ratesDone}
              className="w-full rounded-full bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-40">
              {filling ? t("tour.wsFilling") : t("tour.wsFill")}
            </button>
            {!ratesDone && (
              <button type="button" onClick={openRates} className="w-full rounded-xl bg-black/[0.03] px-3 py-2 text-left text-[12px] font-semibold text-matchup hover:bg-black/[0.06]">{t("tour.wsCostNeedRates")}</button>
            )}
            <p className="text-[11px] leading-relaxed text-neutral-400">
              {t("tour.wsFillShort")}
              <InfoHint label={t("tour.wsFillInfo")}>{t("tour.wsFillLong")}</InfoHint>
            </p>
            {fillReport && (
              <p className="mt-1 rounded-xl bg-matchup/[0.06] px-3 py-2 text-[12px] leading-relaxed text-neutral-600">
                {fillReport.added > 0
                  ? t("tour.wsFillDone", { added: fillReport.added, occupied: fillReport.occupied })
                  : fillReport.reason === "weeks_full" ? t("tour.wsFillWeeksFull")
                  : fillReport.reason === "budget" ? t("tour.wsFillBudget")
                  : t("tour.wsFillNoCandidates")}
              </p>
            )}
          </section>

          {/* Bei schmalem Fenster (keine eigene Detailspalte) faltet die Übersicht hier ein. */}
          {foldOverview && (
            <section className="border-t border-neutral-100 pt-4">{overviewSection}</section>
          )}

          {/* Meine Saison */}
          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsSeasonTitle")} · {seasonOrdered.length}</h2>
              {/* Zweiter Weg in Pipeline + Bilanz — direkt im Saison-Kontext. */}
              <span className="flex shrink-0 items-center gap-2.5">
                <Link href="/tour/pipeline" className="text-[11px] font-semibold text-matchup hover:underline">{t("tour.pipelineOpen")} →</Link>
                <Link href="/tour/finance" className="text-[11px] font-semibold text-matchup hover:underline">{t("tour.financeOpen")} →</Link>
                <Link href="/tour/wildcards" className="text-[11px] font-semibold text-matchup hover:underline">{t("tour.wildcardsOpen")} →</Link>
                <Link href="/tour/form" className="text-[11px] font-semibold text-matchup hover:underline">{t("tour.formOpen")} →</Link>
              </span>
            </div>
            {seasonOrdered.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-neutral-300 px-4 py-4 text-center text-[13px] text-neutral-500">{t("tour.wsSeasonEmpty")}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {start && (
                  <li className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-[13px]">⌂</span>
                    {t("tour.wsStart")}{startName ? ` · ${startName}` : ""}
                  </li>
                )}
                {seasonOrdered.map(({ tt, order }) => (
                  <li key={tt.id} className={`flex items-start gap-2 rounded-xl px-1.5 py-1 ${selectedId === tt.id ? "bg-matchup/[0.06] ring-1 ring-matchup/40" : ""}`}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-matchup text-[11px] font-bold text-white">{order}</span>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => setSelectedId(tt.id)} className="block w-full text-left">
                        <p className="truncate text-[13px] font-semibold text-neutral-900">{tt.city || t("tour.fieldMissing")}<span className="text-neutral-400">, {catName(tt.country)}</span></p>
                        <p className="text-[11px] text-neutral-500">{fmtDay(tt.tournament_monday)} · {tt.category || "—"}</p>
                      </button>
                      <div className="mt-0.5"><DeadlineCountdown tournament={tt} now={nowMs} /></div>
                      {entryPill(tt)}
                    </div>
                    <button type="button" onClick={() => toggle(tt.id)} className="mt-0.5 shrink-0 text-[12px] font-semibold text-neutral-400 hover:text-neutral-800">{t("tour.seasonRemove")}</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Turnierkatalog */}
          <section>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsBrowseTitle")} · {catalog.total}</h2>
            <div className="mt-2 space-y-1">
              {catalog.clusters.map((cl) => {
                const open = expanded.has(cl.key);
                const inCount = cl.items.filter((x) => seasonIds.has(x.id)).length;
                return (
                  <div key={cl.key} className="rounded-xl ring-1 ring-black/[0.06]">
                    <button type="button" onClick={() => setExpanded((s) => { const n = new Set(s); if (n.has(cl.key)) n.delete(cl.key); else n.add(cl.key); return n; })} className="flex w-full items-center gap-2 px-3 py-2 text-left">
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-br from-matchup to-violet-500 px-1.5 text-[11px] font-bold text-white">{cl.items.length}×</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-neutral-900">{cl.place}<span className="text-neutral-400">, {catName(cl.country)}</span></span>
                        <span className="block text-[11px] text-neutral-500">{cl.items.length} {t("tour.wsWeeks")}{inCount ? ` · ${inCount} ${t("tour.wsInSeason")}` : ""}</span>
                      </span>
                      <span className={`text-neutral-300 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {open && <div className="border-t border-black/[0.06] p-1">{cl.items.map((it) => catalogRow(it))}</div>}
                  </div>
                );
              })}
              {catalog.singles.map((tt) => catalogRow(tt))}
              {catalog.clusters.length === 0 && catalog.singles.length === 0 && (
                <p className="rounded-xl bg-black/[0.02] px-4 py-3 text-[13px] text-neutral-500">{t("tour.opt.emptyNoTournaments")}</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
  const catalogPanel = (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">{t("tour.plTitle")}</h1>
          {/* Kommandozentrale — prominent im Kopf, geht nicht im Scroll unter. */}
          <Link href="/tour/pipeline" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-neutral-700">
            {t("tour.pipelineOpen")} →
          </Link>
        </div>
      </div>
      {catalogScroll}
    </div>
  );
  // SPALTE 4 als eigenständige Fläche (Übersicht, wenn nichts gewählt ist).
  const overviewPanel = (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-900">{t("tour.wsOverviewTitle")}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{overviewSection}</div>
    </div>
  );

  // Einführung nur beim ersten Besuch: solange keine Wohnort-KOORDINATEN im Profil stehen.
  // Bewusst auf Koordinaten, nicht auf city — profiles.city ist NOT NULL (immer gesetzt),
  // taugt also nicht als Gate; die Reisekosten hängen an den Koordinaten. Wer aus /app mit
  // Standort kommt (lat/lng in profiles_private vorhanden), sieht die Einführung NIE. Danach weg.
  const homeSet = profile?.lat != null && profile?.lng != null;
  const showIntro = status === "ready" && !homeSet && !profileOpen;

  const introBody = profile && !profile.hasProfile ? (
    <div className="w-[360px] max-w-full">{noProfileHint}</div>
  ) : (
    <div className="w-[360px] max-w-full">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
      {/* Der eine Satz sagt, WOZU der Wohnort dient — nicht nur, dass er fehlt. */}
      <p className="mt-1 text-[15px] font-semibold leading-snug text-neutral-900">{t("tour.wsIntroLead")}</p>
      <div className="relative mt-3">
        <input value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder={t("tour.wsIntroField")} className={inp} autoFocus />
        {geoResults.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">
            {geoResults.map((c, i) => (
              <li key={`${c.country}|${c.name}|${i}`}>
                <button type="button" onClick={() => pickHome({ city: c.name, country: c.country, lat: c.lat, lng: c.lng })} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03]">
                  <span className="truncate font-semibold text-neutral-900">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-neutral-400">{catName(c.country)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Schnellwahl: kuratierte Wohnorte, falls die Stadt schon dabei ist. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {HOME_BASES.map((b) => (
          <button key={b.name} type="button" onClick={() => pickHome({ city: b.name, country: profile?.country ?? null, lat: b.lat, lng: b.lng })} className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-neutral-600 ring-1 ring-black/10 hover:bg-black/[0.03]">
            {b.name}
          </button>
        ))}
      </div>
    </div>
  );

  // Profil-Chip oben rechts über der Karte (Desktop + Mobile = obere Leiste).
  const chip = profile && (
    <button type="button" onClick={() => setProfileOpen(true)} className="absolute right-3 top-3 z-[70] flex max-w-[70%] items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3 shadow-lg ring-1 ring-black/10 backdrop-blur hover:bg-white">
      {profile.profileImage ? (
        // Profilbild aus /app (profiles.profile_image) statt Initialen.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.profileImage} alt="" loading="lazy" decoding="async" className="h-8 w-8 shrink-0 rounded-full bg-matchup/10 object-cover" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[13px] font-bold text-matchup">{(profile.firstName?.[0] ?? "?").toUpperCase()}</span>
      )}
      <span className="min-w-0 text-left leading-tight">
        {profile.hasProfile ? (
          <>
            <span className="block truncate text-[13px] font-bold text-neutral-900">{profile.displayName || profile.firstName || t("tour.plStep1")}</span>
            <span className="block truncate text-[11px] text-neutral-500">
              {profile.ranking != null ? `${t("tour.rankLabel")} ${profile.ranking}` : t("tour.noRank")}
              {profile.city ? ` · ${profile.city}` : ""}
            </span>
          </>
        ) : (
          <>
            <span className="block truncate text-[13px] font-bold text-neutral-900">{t("tour.profileSetup")}</span>
            <span className="block truncate text-[11px] text-neutral-500">{t("tour.npChipSub")}</span>
          </>
        )}
      </span>
    </button>
  );

  // ── Responsive Spaltenlogik (rein aus winW, EIN Quell-Wert → deckungsgleich mit den
  //    Breakpoint-Screenshots). Drop-Reihenfolge Filter → Detail → Katalog; Karte nie.
  const isMobile = winW < BP_MOBILE;
  const detailInline = winW >= BP_DETAIL;        // Detailspalte steht rechts inline (≥1200)
  const filterCanInline = winW >= BP_FOUR;       // Filterspalte darf inline stehen (≥1520)
  const filterInline = filterCanInline && filtersOpen;
  const filterDrawer = filtersOpen && !filterCanInline; // sonst Overlay-Drawer (Desktop 1024–1519 + Mobile)
  const detailDrawer = !detailInline && !!detailEl;     // Detail als rechtes Overlay (1024–1199)

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-white text-neutral-900">
      {/* SPALTE 1 — Filter inline (≥1520, offen): schiebt Katalog/Karte nach rechts. */}
      {!isMobile && filterInline && (
        <aside className="flex shrink-0 flex-col border-r border-neutral-200 bg-white" style={{ width: FILTER_W }}>{filterPanel}</aside>
      )}

      {/* SPALTE 2 — Katalog (nur Desktop; mobil im Bottom-Sheet). */}
      {!isMobile && (
        <aside className="flex shrink-0 flex-col bg-white" style={{ width: leftW }}>{catalogPanel}</aside>
      )}
      {/* Zieh-Griff Katalog ↔ Karte (nur Desktop). */}
      {!isMobile && (
        <div
          onMouseDown={startLeftDrag}
          role="separator"
          aria-orientation="vertical"
          aria-label={t("tour.panelResize")}
          title={t("tour.panelResize")}
          className="w-1.5 shrink-0 cursor-col-resize bg-neutral-200 transition-colors hover:bg-matchup/40 active:bg-matchup/60"
        />
      )}

      {/* SPALTE 3 — Karte (immer da, flex-1). */}
      <div className="relative flex-1 bg-neutral-100">
        <PlannerMap start={start} plan={planStops} candidates={candidateStops} selectedId={selectedId} onSelect={handleSelect} />
        {chip}
        {/* Wohnland geändert → kurze, sichtbare Rückmeldung (steuert Visa-Warnungen). */}
        {homeCountryMsg && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[72] -translate-x-1/2">
            <span className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-lg">{t("tour.wsHomeCountrySet", { country: homeCountryMsg })}</span>
          </div>
        )}
        {/* Einführung als Einblendung über der Karte (Desktop). */}
        {!isMobile && showIntro && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[65] flex justify-center p-6">
            <div className="pointer-events-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">{introBody}</div>
          </div>
        )}
      </div>

      {/* SPALTE 4 — Detail inline (≥1200): Reiter, sonst Saison-Übersicht. */}
      {!isMobile && detailInline && (
        <aside className="flex shrink-0 flex-col border-l border-neutral-200 bg-white" style={{ width: DETAIL_W }}>{detailEl ?? overviewPanel}</aside>
      )}

      {/* Detail als rechtes Overlay (1024–1199, wenn gewählt). */}
      {!isMobile && detailDrawer && (
        <>
          <div className="absolute inset-0 z-[75] bg-black/30" onClick={() => setSelectedId(null)} />
          <aside className="absolute right-0 top-0 z-[76] flex h-full flex-col border-l border-neutral-200 bg-white shadow-2xl" style={{ width: DETAIL_W }}>{detailEl}</aside>
        </>
      )}

      {/* Filter als Overlay-Drawer (Desktop 1024–1519). */}
      {!isMobile && filterDrawer && (
        <>
          <div className="absolute inset-0 z-[75] bg-black/30" onClick={toggleFilters} />
          <aside className="absolute left-0 top-0 z-[76] flex h-full flex-col border-r border-neutral-200 bg-white shadow-2xl" style={{ width: FILTER_W }}>{filterPanel}</aside>
        </>
      )}

      {/* Mobile — Vollkarte + Bottom-Sheet (Detail bei Auswahl, sonst Katalog inkl. Übersicht). */}
      {isMobile && (
        <div className={`absolute inset-x-0 bottom-0 z-[60] flex h-[62%] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-44px)]"}`}>
          <button type="button" onClick={() => setSheetOpen((o) => !o)} aria-expanded={sheetOpen} className="flex h-11 shrink-0 items-center justify-center gap-2 border-b border-neutral-100 text-[13px] font-bold text-neutral-700">
            {t("tour.plTitle")}<span aria-hidden className={`transition-transform ${sheetOpen ? "" : "rotate-180"}`}>▾</span>
          </button>
          <div className="min-h-0 flex-1 overflow-hidden">{showIntro ? <div className="p-5">{introBody}</div> : detailEl ?? catalogScroll}</div>
        </div>
      )}

      {/* Mobile — Filter als Vollflächen-Drawer von links. */}
      {isMobile && filtersOpen && (
        <div className="absolute inset-0 z-[85] flex">
          <div className="absolute inset-0 bg-black/40" onClick={toggleFilters} />
          <aside className="relative z-[86] flex h-full w-[86%] max-w-[340px] flex-col bg-white shadow-2xl">{filterPanel}</aside>
        </div>
      )}

      {/* Profil-Bearbeitung als Überlagerung (Chip-Klick). */}
      {profileOpen && profile && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setProfileOpen(false)}>
          <div className="max-h-[85vh] w-[420px] max-w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setProfileOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[18px] text-neutral-500 hover:bg-black/[0.05]" aria-label={t("common.close")}>✕</button>
            </div>
            {profile.hasProfile ? (
              <>
                {/* Identitäts-Block: aus dem /app-Profil ÜBERNOMMEN — Bild, voller Name, Wohnland. */}
                <div className="-mt-6 mb-1 flex min-w-0 items-center gap-3 pr-10">
                  {profile.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImage} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-full bg-matchup/10 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[17px] font-bold text-matchup">{(profile.firstName?.[0] ?? "?").toUpperCase()}</span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-extrabold text-neutral-900">{profile.displayName || profile.firstName || t("tour.plStep1")}</h2>
                    {(profile.countryName || profile.country || profile.city) && (
                      <p className="truncate text-[12px] text-neutral-500">{[profile.countryName || (profile.country ? catName(profile.country) : ""), profile.city].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                </div>
                <p className="mb-4 text-[11px] text-neutral-400">{t("tour.wsIdentityFrom")}</p>
                {profileEditor}
              </>
            ) : (
              <div className="-mt-4 pb-2">{noProfileHint}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
