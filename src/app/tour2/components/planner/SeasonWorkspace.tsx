"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import type { TFunction } from "@/lib/i18n/core";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import { COUNTRY_CODES } from "@/lib/i18n/messages/tour";
import { loadPlannerProfile, placeKey, ratesToCostParams, budgetMoney, buildSeasonCandidates, costRatesComplete, saveHome, type PlannerProfile, type Frame } from "@/lib/tourPlanner";
import { getTourCatalog } from "@/lib/tourCatalogCache";
import { loadTourOptPrefs, saveTourOptPrefs, parseCap, blockedRangesFrom } from "@/lib/tourOptPrefs";
import { loadSeasonTournamentIds, addToSeason, removeFromSeason, clearSeason, loadSeasonPlanRows, loadAllEntryEvents } from "@/lib/tourSeason";
import { alternateTrend } from "@/domain/tour/entryTrend";
import { loadReminderSettings, saveReminderSettings } from "@/lib/tourReminders";
import { saveWhoAmI, saveSeasonBudget } from "@/lib/tourSetup";
import { loadCostRates, type CostRatesPatch } from "@/lib/tourCosts";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import { loadPlayerMaster, loadPlayerDocs, type PlayerDocs } from "@/lib/tourPlayerMaster";
import type { TourTravelDocument } from "@/lib/types";
import { loadResultHistory, toMatchResults, type ResultHistoryRow } from "@/lib/tourResultHistory";
import { loadWildcardContacts, type TourWildcardContact } from "@/lib/tourWildcards";
import { computeSeasonCost } from "@/domain/tour/costs";
import { optimizeSeason, type SeasonObjective, type SeasonProposal } from "@/domain/tour/optimizeSeason";
import { entryDeadlineMs } from "@/domain/tour/finderQuick";
import type { DecideReason } from "@/domain/tour/decide";
import { restDaysBetween, tightArrivals } from "@/domain/tour/travelBuffer";
import { expectedPoints, type PointsRound } from "@/domain/tour/points";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { documentWarnings } from "@/domain/tour/documentWarnings";
import { visaLeadWarnings } from "@/domain/tour/visaLeadWarnings";
import { pointsForecast } from "@/domain/tour/pointsForecast";
import { buildActionBoard, type BoardTournament } from "@/domain/tour/actionBoard";
import { schengenUsage, isSchengenCode, type Stay, type SchengenUsage } from "@/domain/tour/schengen";
import Tour2ActionList from "@/app/tour2/components/Tour2ActionList";
import CostRatesForm from "@/app/tour2/costs/components/CostRatesForm";
import type { TourTournament, TourCostRates, TourSeasonPlanEntry, TourEntryEvent } from "@/lib/types";
import PlannerMap, { type PlanStop, type MapStart } from "./PlannerMap";
import TournamentDetail from "./TournamentDetail";
import InfoHint from "./InfoHint";
import { geocodeCity, type GeoHit } from "@/lib/geocode";
import { HOME_BASES } from "@/lib/tournaments";
import { haversineKm } from "@/lib/utils/haversine";
import SeasonHealthBar from "./SeasonHealthBar";
import SeasonJourney, { type JourneyLeg, type JourneyStop } from "./SeasonJourney";
import { t2markArea } from "../../t2mark";

const DAY = 86_400_000;
const RECENT_KEY = "mu_tour_recent_starts";

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
 * /tour2 Saison (Etappe 2): Gesundheitsleiste, Reiseverlauf, Karte ~40 %, Optimierer
 * im Sheet. Vorschlag zuerst, Übernehmen = INSERT (MU-037, nie ersetzen). Entdecken
 * liegt unter Turniere.
 */
const byMonday = (a: TourTournament, b: TourTournament) => a.tournament_monday.localeCompare(b.tournament_monday);
const hasCoords = (t: TourTournament) => t.latitude != null && t.longitude != null;

function optReasonLabel(t: TFunction, code: string): string {
  const pts = /^erwartungspunkte:(\d+)$/.exec(code);
  if (pts) return t("tour.opt.reason.erwartungspunkte", { n: pts[1] });
  const tight = /^enge_anreise:(\d+)$/.exec(code);
  if (tight) return t("tour.opt.reason.enge_anreise", { n: tight[1] });
  return t(`tour.opt.reason.${code}`);
}
export default function SeasonWorkspace({ initialSelectedId = null }: { initialSelectedId?: string | null }) {
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
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [mapOpen, setMapOpen] = useState(false); // Handy: Karte aufklappbar; Desktop immer sichtbar
  useEffect(() => { if (initialSelectedId) setSelectedId(initialSelectedId); }, [initialSelectedId]);

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
  const [budget, setBudget] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryBoxRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  // Pass-Auswahl als EIGENES Element (kein natives select — das rendert auf iOS Safari
  // unzuverlässig, Optionen fielen als Fließtext heraus). Muster wie der Länder-Filter.
  const [passportOpen, setPassportOpen] = useState(false);
  const [passportQuery, setPassportQuery] = useState("");
  const passportBoxRef = useRef<HTMLDivElement>(null);
  // Stand der Stammdaten (für die Übersicht im Profil-Overlay), lazy beim Öffnen geladen.
  const [setupSummary, setSetupSummary] = useState<{ travelDocs: number; equipment: boolean; emergency: boolean; passport: boolean; insurance: boolean } | null>(null);

  // Etappe 3: Kostensätze, Nächte-Annahme, Schengen-Aufenthalte, Smart-Fill-Zustand.
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [nights, setNights] = useState<string>(() => loadTourOptPrefs().nights);
  const [buffer, setBuffer] = useState<string>(() => loadTourOptPrefs().buffer);
  // Anreisepuffer (Tage): leer → Vorgabe 2 (wie im Optimierer). Steuert Optimierer + „Knappe Anreise"-Marker.
  const bufferNum = useMemo(() => { const n = parseInt(buffer.trim(), 10); return Number.isFinite(n) && n >= 0 ? n : 2; }, [buffer]);
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] = useState<SeasonProposal | null>(null);
  const [whyById, setWhyById] = useState<Map<string, DecideReason[]>>(new Map());
  const [maxPicks, setMaxPicks] = useState(() => loadTourOptPrefs().maxPicks);
  const [maxStreak, setMaxStreak] = useState(() => loadTourOptPrefs().maxStreak);
  const [blockedFrom, setBlockedFrom] = useState(() => loadTourOptPrefs().blockedFrom);
  const [blockedTo, setBlockedTo] = useState(() => loadTourOptPrefs().blockedTo);
  const openFillSheet = useCallback(() => {
    const p = loadTourOptPrefs();
    setNights(p.nights);
    setBuffer(p.buffer);
    setMaxPicks(p.maxPicks);
    setMaxStreak(p.maxStreak);
    setBlockedFrom(p.blockedFrom);
    setBlockedTo(p.blockedTo);
    setFiltersOpen(true);
  }, []);
  const closeFillSheet = useCallback(() => {
    setFiltersOpen(false);
  }, []);
  // MU-037: Rückmeldung nach dem Füllen. reason erklärt, WARUM nichts dazukam.
  const [fillReport, setFillReport] = useState<{ added: number; occupied: number; reason: "added" | "weeks_full" | "budget" | "no_candidates" } | null>(null);
  // Saison leeren (Reset): NUR nach Sicherheitsabfrage (Datenverlust-Lehre MU-037).
  const [confirmReset, setConfirmReset] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [costOpen, setCostOpen] = useState(false); // Kostensätze/Nächte bearbeiten (aufklappbar, wenn Sätze schon da sind)
  const [nowMs] = useState(() => Date.now()); // Stichtag für den Meldefrist-Countdown (aus der Komponente)

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [p, ts, ids, cr, planRows, evs, pdocs, rhist, wcs, tdocs] = await Promise.all([
          loadPlannerProfile(user.id), getTourCatalog(), loadSeasonTournamentIds(), loadCostRates(), loadSeasonPlanRows(), loadAllEntryEvents(), loadPlayerDocs(user.id), loadResultHistory(user.id), loadWildcardContacts(user.id), loadTravelDocuments(user.id),
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
        t2markArea("season");
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
  // „Knappe Anreise": enge Übergänge zwischen benachbarten Saison-Turnieren an
  // VERSCHIEDENEN Orten (weniger Ruhetage als der Puffer). Markiert das ankommende
  // Turnier — nur Hinweis, nichts wird entfernt (reine, getestete Logik in travelBuffer).
  const tightMap = useMemo(
    () => tightArrivals(
      seasonOrdered.map(({ tt }) => ({ id: tt.id, place: placeKey(tt.country, tt.city), mondayMs: Date.parse(tt.tournament_monday + "T00:00:00Z") })),
      bufferNum,
    ),
    [seasonOrdered, bufferNum],
  );
  const planStops: PlanStop[] = useMemo(
    () => seasonOrdered.filter((s) => hasCoords(s.tt)).map((s) => ({ id: s.tt.id, lat: s.tt.latitude as number, lng: s.tt.longitude as number, order: s.order })),
    [seasonOrdered],
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

  // Reset: die GANZE Saison leeren (nach Bestätigung). Karte wird dadurch leer.
  const resetSeason = useCallback(async () => {
    if (!user || clearing) return;
    setClearing(true);
    const backup = new Set(seasonIds);
    setSeasonIds(new Set()); // optimistisch
    try {
      await clearSeason(user.id);
      setFillReport(null);
      setConfirmReset(false);
      await reloadEntries();
    } catch {
      setSeasonIds(backup); // bei Fehler zurückrollen
    } finally {
      setClearing(false);
    }
  }, [user, clearing, seasonIds, reloadEntries]);

  // ── Etappe 3: reaktive Kosten & Status ─────────────────────────────────────────
  // Nächte-Annahme (localStorage): leer → 7 (Domain-Default), sonst die Eingabe.
  const nightsNum = useMemo(() => { const n = parseInt(nights.trim(), 10); return Number.isFinite(n) && n >= 0 ? n : 7; }, [nights]);
  useEffect(() => { saveTourOptPrefs({ nights }); }, [nights]);
  useEffect(() => { saveTourOptPrefs({ buffer }); }, [buffer]);
  useEffect(() => { saveTourOptPrefs({ maxPicks }); }, [maxPicks]);
  useEffect(() => { saveTourOptPrefs({ maxStreak }); }, [maxStreak]);
  useEffect(() => { saveTourOptPrefs({ blockedFrom }); }, [blockedFrom]);
  useEffect(() => { saveTourOptPrefs({ blockedTo }); }, [blockedTo]);

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
  const healthPoints = useMemo(() => {
    let sum = 0;
    for (const { tt } of seasonOrdered) {
      sum += expectedPoints(tt.category, "R16", tt.tournament_monday).points;
    }
    return sum;
  }, [seasonOrdered]);

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

  // „Vorschlag erstellen": Optimierer rechnen, NICHT schreiben. Übernehmen = INSERT (MU-037).
  const smartFill = useCallback(async () => {
    if (!user || filling || applying || !costRatesComplete(rates)) return;
    setFilling(true);
    setProposal(null);
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
      const blockedRanges = blockedRangesFrom(blockedFrom, blockedTo);
      const result = optimizeSeason({
        candidates,
        budget: remainingM,
        params,
        homePlace,
        nightsPerWeek: nights.trim() === "" ? null : nightsNum,
        bufferDays: buffer.trim() === "" ? null : bufferNum,
        now: new Date(),
        schengen: schengenApplies ? { applies: true, existingStays: stays } : null,
        entryBanned: banned,
        objective,
        expectedRound: objective === "most_points" ? expRound : null,
        maxPicks: parseCap(maxPicks),
        maxConsecutiveWeeks: parseCap(maxStreak),
        blockedRanges,
      });
      const picks = result.picks.filter((p) => !seasonIds.has(p.id));
      if (picks.length > 0) {
        setProposal(result);
        setWhyById((prev) => {
          const next = new Map(prev);
          for (const p of picks) next.set(p.id, p.reasons);
          return next;
        });
        setFillReport(null);
        return;
      }
      let reason: "added" | "weeks_full" | "budget" | "no_candidates" = "added";
      if (candidates.length === 0) reason = blockedWeeks.size > 0 ? "weeks_full" : "no_candidates";
      else if ((remainingM != null && remainingM.amount <= 0) || result.rejected.some((r) => r.reasons.some((x) => x.code === "budget_erschoepft"))) reason = "budget";
      else reason = "no_candidates";
      setFillReport({ added: 0, occupied: blockedWeeks.size, reason });
    } catch {
      try { setSeasonIds(await loadSeasonTournamentIds()); } catch { /* egal */ }
    } finally {
      setFilling(false);
    }
  }, [user, filling, applying, rates, budget, profile, tours, frame, nights, nightsNum, buffer, bufferNum, schengenApplies, stays, banned, seasonIds, cost, objective, expRound, maxPicks, maxStreak, blockedFrom, blockedTo]);

  const applyProposal = useCallback(async () => {
    if (!user || applying || filling || !proposal) return;
    setApplying(true);
    try {
      const blockedWeeks = new Set<string>();
      for (const id of seasonIds) { const tt = tours.find((x) => x.id === id); if (tt?.tournament_monday) blockedWeeks.add(tt.tournament_monday); }
      const picks = proposal.picks.filter((p) => !seasonIds.has(p.id));
      if (picks.length > 0) {
        const next = new Set(seasonIds);
        picks.forEach((p) => next.add(p.id));
        setSeasonIds(next);
        await Promise.all(picks.map((p) => addToSeason(user.id, p.id)));
        await reloadEntries();
      }
      setFillReport({ added: picks.length, occupied: blockedWeeks.size, reason: picks.length > 0 ? "added" : "no_candidates" });
      setProposal(null);
    } catch {
      try { setSeasonIds(await loadSeasonTournamentIds()); } catch { /* egal */ }
    } finally {
      setApplying(false);
    }
  }, [user, applying, filling, proposal, seasonIds, tours, reloadEntries]);

  const money = useCallback((minor: number, cur: string) => new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100), [locale]);

  const journeyLegs = useMemo((): JourneyLeg[] => {
    const legs: JourneyLeg[] = [];
    for (let i = 1; i < seasonOrdered.length; i++) {
      const a = seasonOrdered[i - 1].tt;
      const b = seasonOrdered[i].tt;
      const rest = restDaysBetween(Date.parse(a.tournament_monday + "T00:00:00Z"), Date.parse(b.tournament_monday + "T00:00:00Z"));
      const pa = placeKey(a.country, a.city);
      const pb = placeKey(b.country, b.city);
      const cluster = pa != null && pa === pb;
      let km: number | null = null;
      if (!cluster && hasCoords(a) && hasCoords(b)) {
        km = haversineKm(a.latitude as number, a.longitude as number, b.latitude as number, b.longitude as number);
      }
      const st = cost?.stations[i];
      const arrivalItem = st?.items.find((it) => it.code === "arrival" && !("unknown" in it && it.unknown));
      const amount = arrivalItem && "amount" in arrivalItem ? money(arrivalItem.amount, arrivalItem.currency) : null;
      legs.push({
        km,
        restDays: rest,
        tight: tightMap.has(b.id),
        cluster,
        arrivalText: cluster || !amount ? null : t("tour.t2legArrival", { amount }),
      });
    }
    return legs;
  }, [seasonOrdered, cost, money, tightMap, t]);

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
  const handleSelect = useCallback((id: string) => { setSelectedId(id); setMapOpen(true); }, []);

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

  // Außenklick/Escape schließt das Pass-Dropdown.
  useEffect(() => {
    if (!passportOpen) return;
    const onDoc = (e: MouseEvent) => { if (passportBoxRef.current && !passportBoxRef.current.contains(e.target as Node)) setPassportOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setPassportOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [passportOpen]);

  // Stammdaten-Stand für die Übersicht im Profil-Overlay — lazy bei jedem Öffnen frisch.
  useEffect(() => {
    if (!user || !profileOpen) return;
    let alive = true;
    (async () => {
      try {
        const [m, tdocs] = await Promise.all([loadPlayerMaster(user.id), loadTravelDocuments(user.id)]);
        if (!alive) return;
        const eq = m.equipment;
        setSetupSummary({
          travelDocs: tdocs.length,
          equipment: !!(eq && (eq.racket || eq.string_model || eq.tension_main != null || eq.tension_cross != null || eq.grip_size)),
          emergency: !!(m.emergency && m.emergency.contact_name),
          passport: !!(m.docs && (m.docs.passport_country || m.docs.passport_expiry)),
          insurance: !!(m.docs && (m.docs.insurance_provider || m.docs.insurance_expiry)),
        });
      } catch { /* still */ }
    })();
    return () => { alive = false; };
  }, [user, profileOpen]);

  const selCountries = frame.countries ?? [];
  const toggleCountry = (iso: string) => setFrame((f) => {
    const cur = new Set(f.countries ?? []);
    if (cur.has(iso)) cur.delete(iso); else cur.add(iso);
    return { ...f, countries: [...cur] };
  });

  // Serie/Belag (Mehrfachauswahl). Leere Auswahl = kein Filter (siehe matchesFrameKind).
  const SERIES_OPTS: { v: string; label: string }[] = [
    { v: "itf_wtt", label: t("tour.seriesItf") },
    { v: "itf_juniors", label: t("tour.seriesJuniors") },
    { v: "wta", label: t("tour.seriesWta") },
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

  const todayISO = new Date(nowMs).toISOString().slice(0, 10);
  const nextDeadline = useMemo(() => {
    let best: { monday: string; country: string | null } | null = null;
    let bestMs = Infinity;
    for (const { tt } of seasonOrdered) {
      const dl = tourDeadlines(new Date(tt.tournament_monday + "T00:00:00Z"), tt.series, tt.category);
      const ms = dl.entry ? dl.entry.getTime() : null;
      if (ms == null || ms < nowMs) continue;
      if (ms < bestMs) { bestMs = ms; best = { monday: tt.tournament_monday, country: tt.country }; }
    }
    return best;
  }, [seasonOrdered, nowMs]);
  const docWarnings = useMemo(() => {
    if (!docs) return [];
    return documentWarnings({
      passports: [
        { country: docs.passport_country, expiry: docs.passport_expiry },
        { country: docs.passport2_country, expiry: docs.passport2_expiry },
      ],
      insurance: { expiry: docs.insurance_expiry, international: docs.insurance_international },
      nextTrip: nextDeadline ? { destination: nextDeadline.country, entryDate: nextDeadline.monday } : null,
      asOf: todayISO,
    });
  }, [docs, nextDeadline, todayISO]);
  const board = useMemo(() => {
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
    const f = pointsForecast(toMatchResults(resultHistory), todayISO);
    const soon4 = f.steps.find((s) => s.weeks === 4)?.expiring[0] ?? null;
    const points = resultHistory.length
      ? {
          total: f.currentTotal,
          nextExpiry: f.schedule[0] ? { date: f.schedule[0].expiresOn, points: f.schedule[0].points } : null,
          expiringSoon: soon4 ? { date: soon4.expiresOn, points: soon4.points } : null,
        }
      : null;
    const visaLead = visaLeadWarnings({
      asOf: todayISO,
      tournaments: seasonOrdered.map(({ tt }) => ({ id: tt.id, city: tt.city, country: tt.country, monday: tt.tournament_monday })),
      docs: travelDocs.map((d) => ({ scope: d.scope, status: d.status, valid_until: d.valid_until, lead_weeks: d.lead_weeks })),
    });
    const curc = rates?.currency ?? "EUR";
    const spent = cost ? (cost.total[curc] ?? 0) : 0;
    const over = budgetMinor ? spent - budgetMinor.amount : null;
    return buildActionBoard({
      asOf: todayISO,
      tournaments,
      banned: [...banned],
      docWarnings,
      schengen: schengen ? { exceeds: schengen.exceeds, used: schengen.used, left: schengen.left } : null,
      points,
      wildcards: wildcards.map((wc) => ({ tournamentName: byId.get(wc.tournament_id)?.city ?? "—", tournamentId: wc.tournament_id, requestedOn: wc.requested_on, outcome: wc.outcome })),
      budgetOver: over != null && over > 0 ? { amountMinor: over, currency: curc } : null,
      visaLead,
    });
  }, [todayISO, seasonOrdered, planByTour, eventsByPlan, resultHistory, travelDocs, banned, docWarnings, schengen, wildcards, byId, rates?.currency, cost, budgetMinor]);

  // ── Auth-Gate ────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="flex h-full items-center justify-center text-sm text-[var(--t2-muted)]">{t("tour.t2authChecking")}</div>;
  // Anmeldemaske direkt in /tour (dieselbe Supabase-Anmeldung → geteilte Sitzung), statt
  // nach /app zu verweisen. Das Weiterleiten wirkte wie eine Sackgasse.
  if (!user) return <TourLoginCard />;

  const inp = "t2-input";
  const filt = (on: boolean) => `t2-chip ${on ? "is-on" : ""}`;


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
    const cls = status === "main_draw" || status === "entered" || status === "qualifying" || status === "confirmed" ? "text-matchup"
      : status === "alternate" ? "text-[var(--t2-ink)]"
      : status === "withdrawn" || status === "cancelled" ? "text-[var(--t2-muted)] line-through"
      : "text-[var(--t2-muted)]";
    const word = `${t(`tour.status_${status}`)}${status === "alternate" && pos != null ? ` #${pos}` : ""}`;
    // Trend nur bei Alternate.
    const events = plan ? (eventsByPlan.get(plan.id) ?? []) : [];
    const trend = status === "alternate"
      ? alternateTrend(events.map((e) => ({ observedAt: e.observed_at, alternatePosition: e.alternate_position })), asOfDate)
      : { kind: "none" as const };
    return (
      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <span className={`text-[11px] font-semibold ${cls}`}>{word}</span>
        {trend.kind === "up" && <span className="text-[11px] font-bold text-matchup" title={t("tour.wsTrendUp", { n: trend.delta })}>↑</span>}
        {trend.kind === "down" && <span className="text-[11px] font-bold" title={t("tour.wsTrendDown", { n: -trend.delta })}>↓</span>}
        {trend.kind === "flat" && <span className="text-[11px] font-bold text-[var(--t2-muted)]" title={t("tour.wsTrendFlat")}>•</span>}
        {trend.kind === "stale" && <span className="text-[10.5px] text-[var(--t2-muted)]">{t("tour.wsEntryAsOf", { date: fmtDay(trend.observedAt) })}</span>}
      </span>
    );
  };

  // Anzeigewerte für die Kosten-Sektion (reine Ableitungen, keine Systemzeit).
  const ratesDone = costRatesComplete(rates);
  const cur = rates?.currency ?? "EUR";
  const weekCostMinor = ratesDone ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nightsNum + (rates!.food_per_day_minor ?? 0) * nightsNum + (rates!.coach_per_week_minor ?? 0) : 0;
  const spentMinor = cost ? (cost.total[cur] ?? 0) : 0;
  const budgetLeftMinor = budgetMinor ? budgetMinor.amount - spentMinor : null;

  // Pass-Kandidaten (noch nicht gewählt, nach Suchtext gefiltert) für das eigene Auswahl-Element.
  const pq = passportQuery.trim().toLowerCase();
  const passportOptions = profile
    ? COUNTRY_CODES.filter((c) => !profile.passports.includes(c) && (pq === "" || catName(c).toLowerCase().includes(pq) || c.toLowerCase().includes(pq)))
    : [];

  // Profil-Editor (Ranking/Wohnland/Pässe) — liegt jetzt in der Chip-Überlagerung, nicht mehr im Panel.
  const profileEditor = profile && (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.rankLabel")}</span>
        <div className="flex gap-2">
          <input value={rankingInput} onChange={(e) => setRankingInput(e.target.value)} inputMode="numeric" placeholder="—" className={inp} />
          <button type="button" onClick={saveRanking} className="t2-cta shrink-0 px-4">{t("common.save")}</button>
        </div>
      </label>
      <div>
        <span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.wsPassports")}</span>
        {profile.passports.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {profile.passports.map((iso) => (
              <button key={iso} type="button" onClick={() => setPassports(profile.passports.filter((p) => p !== iso))} className="flex items-center gap-1 rounded-full bg-matchup/10 px-2.5 py-1 text-[12px] font-semibold text-matchup">
                {catName(iso)} <span className="text-matchup/60">✕</span>
              </button>
            ))}
          </div>
        )}
        {/* Eigenes Auswahl-Element statt nativem select (iOS-Safari-Renderfehler). */}
        <div className="relative" ref={passportBoxRef}>
          <button type="button" onClick={() => setPassportOpen((o) => !o)} className={`${inp} flex items-center justify-between`}>
            <span className="text-[var(--t2-muted)]">{t("tour.wsAddPassport")}</span>
            <span className={`text-[var(--t2-faint)] transition-transform ${passportOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          {passportOpen && (
            <div className="absolute left-0 right-0 z-30 mt-1.5 rounded-2xl border border-[var(--t2-line)] bg-white p-2 shadow-xl">
              <input value={passportQuery} onChange={(e) => setPassportQuery(e.target.value)} placeholder={t("tour.wsCountrySearch")} className={`${inp} mb-2`} autoFocus />
              <div className="max-h-56 overflow-auto">
                {passportOptions.map((iso) => (
                  <button key={iso} type="button" onClick={() => { setPassports([...profile.passports, iso]); setPassportOpen(false); setPassportQuery(""); }} className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-[13px] text-[var(--t2-ink)] hover:bg-[var(--t2-surface)]">
                    {catName(iso)}
                  </button>
                ))}
                {passportOptions.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-[var(--t2-faint)]">—</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.wsProfileNote")}</p>

      {/* Fristen-Erinnerungen per E-Mail — Vorgabe an, jederzeit abschaltbar. */}
      <div className="border-t border-[var(--t2-line)] pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.wsRemindersLabel")}</span>
          <button type="button" role="switch" aria-checked={reminderEnabled} onClick={() => toggleReminders(!reminderEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${reminderEnabled ? "bg-matchup" : "bg-[var(--t2-line-strong)]"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${reminderEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.wsRemindersHint")}</p>
      </div>
    </div>
  );

  // Eingeloggt, aber keine web.profiles-Zeile: /tour zeigt sonst leere Felder ohne Erklärung
  // (und Speichern schlägt still fehl, weil das Update 0 Zeilen trifft). Stattdessen ein klarer
  // Hinweis mit Weg ins /app-Onboarding, das die Zeile UND die Identität (Name/Foto/Land) anlegt.
  const noProfileHint = (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-matchup/10 text-[20px]" aria-hidden>👤</div>
      <h3 className="mt-2 text-[15px] font-extrabold text-[var(--t2-ink)]">{t("tour.npTitle")}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--t2-muted)]">{t("tour.npBody")}</p>
      <Link href="/app" className="t2-cta mt-3">{t("tour.npCta")}</Link>
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
      seasonStops={seasonOrdered.map(({ tt }) => ({ id: tt.id, city: tt.city || "", monday: tt.tournament_monday, country: tt.country }))}
      bufferDays={bufferNum}
    />
  ) : null;

  const budgetText = ratesDone && cost && budgetMinor
    ? t("tour.t2budgetOf", { used: money(spentMinor, cur), total: money(budgetMinor.amount, cur) })
    : ratesDone && cost
      ? money(spentMinor, cur)
      : null;
  const budgetOver = budgetLeftMinor != null && budgetLeftMinor < 0;
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const journeyStops: JourneyStop[] = seasonOrdered.map(({ tt, order }, i) => {
    const ms = entryDeadlineMs(tt);
    let deadline: string | null = null;
    if (ms == null) deadline = t("tour.t2findDlUnknown");
    else if (ms <= nowMs) deadline = t("tour.entryExpired");
    else {
      const left = ms - nowMs;
      deadline = t("tour.t2ovCountdown", { d: Math.floor(left / DAY), h: Math.floor((left % DAY) / 3_600_000) });
    }
    const st = cost?.stations[i];
    const costText = st && !st.hasUnknown && Object.keys(st.subtotal).length > 0
      ? Object.entries(st.subtotal).map(([c, v]) => money(v, c)).join(" · ")
      : null;
    return {
      id: tt.id,
      order,
      city: tt.city || t("tour.fieldMissing"),
      country: catName(tt.country),
      date: fmtDay(tt.tournament_monday),
      month: monthFmt.format(new Date(tt.tournament_monday + "T00:00:00Z")),
      category: tt.category || "—",
      pill: entryPill(tt),
      deadline,
      cost: costText,
      why: (whyById.get(tt.id) ?? []).map((r) => optReasonLabel(t, r.code)),
    };
  });

  const proposalPicks = proposal?.picks.filter((p) => !seasonIds.has(p.id)) ?? [];
  const proposalPoints = proposalPicks.reduce((sum, p) => {
    const tt = tours.find((x) => x.id === p.id);
    return sum + expectedPoints(tt?.category ?? null, "R16", p.weekMonday).points;
  }, 0);
  const proposalCostMinor = proposal ? (proposal.cost.total[cur] ?? 0) : 0;

  const fillPanel = (
    <div className="relative flex h-full flex-col bg-[var(--t2-paper)] text-[var(--t2-ink)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--t2-line)] px-4 py-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--t2-muted)]">{t("tour.t2fillSheetTitle")}{activeFilters > 0 ? ` · ${activeFilters}` : ""}</h2>
        <div className="flex items-center gap-1">
          {activeFilters > 0 && <button type="button" onClick={resetFilters} className="text-[12px] font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.wsFiltersReset")}</button>}
          <button type="button" onClick={closeFillSheet} className="flex h-7 w-7 items-center justify-center text-[16px] text-[var(--t2-muted)] hover:text-[var(--t2-ink)]" aria-label={t("common.close")}>✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-[12px] leading-relaxed text-[var(--t2-muted)]">{objective === "most_points" ? t("tour.wsFillShortPoints") : t("tour.wsFillShortTournaments")}</p>
        <section>
          <h3 className="text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.wsStartTitle")}</h3>
          <div className="relative mt-2">
            <input value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder={startName ? t("tour.wsStartCurrent", { name: startName }) : t("tour.wsStartSearch")} className={inp} />
            {geoResults.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--t2-line)] bg-white py-1 shadow-lg">
                {geoResults.map((c, i) => (
                  <li key={`${c.country}|${c.name}|${i}`}>
                    <button type="button" onClick={() => pickStart({ name: c.name, lat: c.lat, lng: c.lng })} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--t2-surface)]">
                      <span className="truncate font-semibold text-[var(--t2-ink)]">{c.name}</span>
                      <span className="shrink-0 text-[11px] text-[var(--t2-faint)]">{catName(c.country)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HOME_BASES.map((b) => (
              <button key={b.name} type="button" onClick={() => pickStart({ name: b.name, lat: b.lat, lng: b.lng })} className={filt(startName === b.name)}>{b.name}</button>
            ))}
          </div>
        </section>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.wsObjectiveTitle")}</span>
          <div className="flex flex-wrap gap-1.5">
            {([["most_tournaments", "wsObjTournaments"], ["most_points", "wsObjPoints"]] as const).map(([v, key]) => (
              <button key={v} type="button" onClick={() => chooseObjective(v)} className={filt(objective === v)}>{t(`tour.${key}`)}</button>
            ))}
          </div>
          {objective === "most_points" && (
            <div className="mt-2.5">
              <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.wsRoundLabel")}</span>
              <div className="flex flex-wrap gap-1.5">
                {ROUND_OPTS.map((r) => (
                  <button key={r} type="button" onClick={() => chooseRound(r)} className={filt(expRound === r)}>{t(`tour.round_${r}`)}</button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.wsRoundHint")}</p>
            </div>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.series")}</span>
          <div className="flex flex-wrap gap-1.5">
            {SERIES_OPTS.map((o) => {
              const on = selSeries.includes(o.v);
              return <button key={o.v} type="button" onClick={() => toggleSeries(o.v)} className={filt(on)}>{o.label}</button>;
            })}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.surfaceLabel")}</span>
          <div className="flex flex-wrap gap-1.5">
            {SURFACE_OPTS.map((s) => {
              const on = selSurface.includes(s);
              return <button key={s} type="button" onClick={() => toggleSurface(s)} className={filt(on)}>{t(`tour.surface_${s}`)}</button>;
            })}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.plRegion")}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setFrame((f) => ({ ...f, region: "all", countries: [] }))} className={filt(selCountries.length === 0 && frame.region === "all")}>{t("tour.plRegionAll")}</button>
            <button type="button" onClick={() => setFrame((f) => ({ ...f, region: "europe", countries: [] }))} className={filt(selCountries.length === 0 && frame.region === "europe")}>{t("tour.plRegionEurope")}</button>
            <div className="relative" ref={countryBoxRef}>
              <button type="button" onClick={() => setCountryOpen((o) => !o)} className={`gap-1.5 ${filt(selCountries.length > 0)}`}>
                {selCountries.length ? t("tour.wsCountriesN", { n: selCountries.length }) : t("tour.wsCountries")}
                <span className={`transition-transform ${countryOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {countryOpen && (
                <div className="absolute left-0 z-30 mt-1.5 w-72 rounded-2xl border border-[var(--t2-line)] bg-white p-2 shadow-xl">
                  <input value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder={t("tour.wsCountrySearch")} className={`${inp} mb-2`} autoFocus />
                  <div className="max-h-64 overflow-auto">
                    {countryList.map(([iso, n]) => {
                      const on = selCountries.includes(iso);
                      return (
                        <button key={iso} type="button" onClick={() => toggleCountry(iso)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[var(--t2-surface)]">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${on ? "border-matchup bg-matchup text-white" : "border-[var(--t2-line-strong)] text-transparent"}`}>✓</span>
                          <span className="min-w-0 flex-1 truncate text-[var(--t2-ink)]">{catName(iso)}</span>
                          <span className="shrink-0 tabular-nums text-[12px] font-semibold text-[var(--t2-faint)]">{n}</span>
                        </button>
                      );
                    })}
                    {countryList.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-[var(--t2-faint)]">{t("tour.opt.emptyNoTournaments")}</p>}
                  </div>
                  {selCountries.length > 0 && (
                    <button type="button" onClick={() => setFrame((f) => ({ ...f, countries: [] }))} className="mt-2 w-full rounded-lg bg-[var(--t2-surface)] py-1.5 text-[12px] font-semibold text-[var(--t2-muted)] hover:bg-[var(--t2-line)]">{t("tour.wsCountriesClear")}</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.plFrom")}</span>
            <input type="date" value={frame.from} onChange={(e) => setFrame((f) => ({ ...f, from: e.target.value }))} className={inp} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.plTo")}</span>
            <input type="date" value={frame.to} onChange={(e) => setFrame((f) => ({ ...f, to: e.target.value }))} className={inp} /></label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.plBudget")}</span>
          <input ref={budgetRef} value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" placeholder="—" className={inp} />
          {budget.trim() === "" && <p className="mt-1 text-[11px] leading-relaxed text-[var(--t2-faint)]">{t("tour.wsBudgetHint")}</p>}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.t2optMaxEvents")}</span>
            <input value={maxPicks} onChange={(e) => setMaxPicks(e.target.value)} inputMode="numeric" placeholder="—" className={inp} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.t2optMaxStreak")}</span>
            <input value={maxStreak} onChange={(e) => setMaxStreak(e.target.value)} inputMode="numeric" placeholder="—" className={inp} /></label>
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.t2optBlocked")}</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="mb-1 block text-[11px] text-[var(--t2-muted)]">{t("tour.t2optBlockedFrom")}</span>
              <input type="date" value={blockedFrom} onChange={(e) => setBlockedFrom(e.target.value)} className={inp} /></label>
            <label className="block"><span className="mb-1 block text-[11px] text-[var(--t2-muted)]">{t("tour.t2optBlockedTo")}</span>
              <input type="date" value={blockedTo} onChange={(e) => setBlockedTo(e.target.value)} className={inp} /></label>
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold text-[var(--t2-muted)]">{t("tour.wsCostTitle")}
            <InfoHint label={t("tour.wsCostInfo")}>
              {ratesDone && <p>{t("tour.wsWeekCost", { amount: money(weekCostMinor, cur) })}</p>}
              {cost && cost.arrivalsSaved > 0 && <p className="mt-1 text-emerald-600">{t("tour.wsArrivalsSaved", { n: cost.arrivalsSaved })}</p>}
              {cost && cost.hasUnknown && <p className="mt-1">{t("tour.wsCostUnknown")}</p>}
              <p className="mt-1">{t("tour.wsCostSource")}</p>
            </InfoHint>
          </span>
          {!ratesDone && !costOpen && (
            <button type="button" onClick={() => setCostOpen(true)} className="w-full rounded-xl bg-[var(--t2-surface)] px-3 py-2 text-left text-[12px] font-semibold text-matchup hover:bg-[var(--t2-line)]">{t("tour.wsCostNeedRates")}</button>
          )}
          {ratesDone && !costOpen && (
            <button type="button" onClick={() => setCostOpen(true)} className="w-full rounded-xl bg-[var(--t2-surface)] px-3 py-2 text-left text-[12px] font-semibold text-matchup hover:bg-[var(--t2-line)]">{t("tour.wsEditRates")}</button>
          )}
          {costOpen && <CostRatesForm rates={rates} userId={user.id} onSaved={onRatesSaved} nights={nights} onNightsChange={setNights} buffer={buffer} onBufferChange={setBuffer} />}
        </div>
      </div>
      <div className="shrink-0 space-y-2 border-t border-[var(--t2-line)] p-4">
        {!ratesDone && <p className="text-[12px] font-semibold text-amber-700">{t("tour.wsCostNeedRates")}</p>}
        <button type="button" onClick={() => void smartFill()} disabled={filling || applying || !ratesDone} className="t2-cta w-full disabled:opacity-40">
          {filling ? t("tour.t2optProposing") : t("tour.t2optPropose")}
        </button>
        {fillReport && proposalPicks.length === 0 && (
          <p className="text-[12px] leading-relaxed text-[var(--t2-muted)]">
            {fillReport.added > 0
              ? t("tour.wsFillDone", { added: fillReport.added, occupied: fillReport.occupied })
              : fillReport.reason === "weeks_full" ? t("tour.wsFillWeeksFull")
              : fillReport.reason === "budget" ? t("tour.wsFillBudget")
              : t("tour.wsFillNoCandidates")}
          </p>
        )}
      </div>
    </div>
  );

  const homeSet = profile?.lat != null && profile?.lng != null;
  const showIntro = status === "ready" && !homeSet && !profileOpen;
  const introBody = profile && !profile.hasProfile ? (
    <div className="w-[360px] max-w-full">{noProfileHint}</div>
  ) : (
    <div className="w-[360px] max-w-full">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
      <p className="mt-1 text-[15px] font-semibold leading-snug text-[var(--t2-ink)]">{t("tour.wsIntroLead")}</p>
      <div className="relative mt-3">
        <input value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder={t("tour.wsIntroField")} className={inp} autoFocus />
        {geoResults.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--t2-line)] bg-white py-1 shadow-lg">
            {geoResults.map((c, i) => (
              <li key={`${c.country}|${c.name}|${i}`}>
                <button type="button" onClick={() => pickHome({ city: c.name, country: c.country, lat: c.lat, lng: c.lng })} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--t2-surface)]">
                  <span className="truncate font-semibold text-[var(--t2-ink)]">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-[var(--t2-faint)]">{catName(c.country)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {HOME_BASES.map((b) => (
          <button key={b.name} type="button" onClick={() => pickHome({ city: b.name, country: profile?.country ?? null, lat: b.lat, lng: b.lng })} className="t2-chip">{b.name}</button>
        ))}
      </div>
    </div>
  );

  const mapPane = (
    <div className="relative h-full min-h-[220px] w-full bg-[var(--t2-paper)]">
      <PlannerMap start={start} plan={planStops} candidates={[]} selectedId={selectedId} onSelect={handleSelect} />
      {homeCountryMsg && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[72] -translate-x-1/2">
          <span className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-lg">{t("tour.wsHomeCountrySet", { country: homeCountryMsg })}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--t2-paper)] text-[var(--t2-ink)]">
      <SeasonHealthBar
        count={seasonOrdered.length}
        budgetText={budgetText}
        budgetOver={budgetOver}
        points={healthPoints}
        roundLabel={t("tour.round_R16")}
        tightCount={tightMap.size}
        schengen={schengen ? { exceeds: schengen.exceeds, used: schengen.used, left: schengen.left } : null}
        objective={objective}
        onObjective={chooseObjective}
        budget={budget}
        onBudget={setBudget}
        frame={frame}
        onFrame={(patch) => setFrame((f) => ({ ...f, ...patch }))}
        maxStreak={maxStreak}
        onMaxStreak={setMaxStreak}
        buffer={buffer}
        onBuffer={setBuffer}
        onPlan={() => { if (!ratesDone) { openFillSheet(); setCostOpen(true); } else void smartFill(); }}
        onMore={openFillSheet}
        planning={filling || applying}
        planDisabled={false}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:w-[60%] md:flex-none">
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2 md:hidden">
            <button type="button" onClick={() => setMapOpen((o) => !o)} className="t2-ghost">
              {mapOpen ? t("tour.t2mapHide") : t("tour.t2mapShow")}
            </button>
            <Link href="/tour2/finder" className="text-[12px] font-semibold text-matchup">{t("tour.t2browseAdd")} →</Link>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-24 md:pb-4">
            {status === "loading" && <p className="text-sm text-[var(--t2-muted)]">{t("tour.t2catalogLoading")}</p>}
            {status === "error" && <p className="text-sm text-[var(--t2-muted)]">{t("tour.loadError")}</p>}
            {status === "ready" && profile && (
              <>
                {board.actions.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-matchup">{t("tour.t2action")}</h2>
                    <Tour2ActionList
                      actions={board.actions}
                      countryName={catName}
                      fmtDate={fmtDay}
                      money={money}
                      onOpenTournament={setSelectedId}
                    />
                  </section>
                )}
                {fillReport && (
                  <p className="mb-3 border border-[var(--t2-line)] px-3 py-2 text-[12px] leading-relaxed text-[var(--t2-muted)]">
                    {fillReport.added > 0
                      ? t("tour.wsFillDone", { added: fillReport.added, occupied: fillReport.occupied })
                      : fillReport.reason === "weeks_full" ? t("tour.wsFillWeeksFull")
                      : fillReport.reason === "budget" ? t("tour.wsFillBudget")
                      : t("tour.wsFillNoCandidates")}
                  </p>
                )}
                <SeasonJourney
                  startLabel={startName}
                  stops={journeyStops}
                  legs={journeyLegs}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={toggle}
                  empty={
                    <div className="border border-[var(--t2-line)] px-4 py-8 text-center">
                      <p className="text-[15px] font-bold">{t("tour.t2noSeason")}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--t2-muted)]">{t("tour.t2seasonEmptyLead")}</p>
                      <button type="button" onClick={() => { if (!ratesDone) { openFillSheet(); setCostOpen(true); } else void smartFill(); }} className="t2-cta mt-4">{t("tour.wsFill")}</button>
                      <Link href="/tour2/finder" className="mt-3 block text-[12px] font-semibold text-matchup">{t("tour.t2browseAdd")} →</Link>
                    </div>
                  }
                />
                <div className="mt-6 flex items-center gap-3">
                  <Link href="/tour2/finder" className="text-[12px] font-semibold text-matchup">{t("tour.t2browseAdd")} →</Link>
                  <Link href="/tour2/calendar" className="text-[12px] font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.wsViewCalendar")}</Link>
                </div>
                {seasonOrdered.length > 0 && (
                  confirmReset ? (
                    <div className="mt-6 border border-red-200 px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-red-700">{t("tour.wsClearConfirm", { n: seasonOrdered.length })}</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={resetSeason} disabled={clearing} className="bg-red-700 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40">{t("tour.wsClearYes")}</button>
                        <button type="button" onClick={() => setConfirmReset(false)} className="t2-ghost">{t("tour.calCancel")}</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmReset(true)} className="mt-6 text-[12px] font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.wsClear")}</button>
                  )
                )}
              </>
            )}
          </div>
        </div>
        <div className={`${mapOpen ? "order-first h-[36vh] shrink-0 md:order-none md:h-auto" : "hidden"} min-h-0 md:block md:w-[40%]`}>{mapPane}</div>
      </div>

      {proposalPicks.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-[70] border-t border-[var(--t2-line)] bg-[var(--t2-paper)] p-4 pb-24 md:pb-4">
          <p className="text-[15px] font-semibold leading-snug text-[var(--t2-ink)]">
            {t("tour.t2optSummary", { n: proposalPicks.length, points: proposalPoints, cost: money(proposalCostMinor, cur) })}
          </p>
          <p className="mt-1 text-[12px] text-[var(--t2-muted)]">{t("tour.t2optSummaryAssume")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void applyProposal()} disabled={applying} className="t2-cta disabled:opacity-40">
              {applying ? t("tour.t2optApplyBusy") : t("tour.t2optApply")}
            </button>
            <button type="button" onClick={() => setProposal(null)} disabled={applying} className="t2-ghost disabled:opacity-40">
              {t("tour.t2optRetry")}
            </button>
          </div>
        </div>
      )}

      {showIntro && (
        <div className="absolute inset-0 z-[65] flex items-start justify-center bg-black/50 p-6">
          <div className="rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-[var(--t2-line)]">{introBody}</div>
        </div>
      )}

      {filtersOpen && (
        <div className="absolute inset-0 z-[85] flex">
          <div className="absolute inset-0 bg-black/50" onClick={closeFillSheet} />
          <aside className="relative z-[86] ml-auto flex h-full w-full max-w-[400px] flex-col shadow-2xl">{fillPanel}</aside>
        </div>
      )}

      {detailEl && (
        <>
          <div className="absolute inset-0 z-[75] bg-black/40" onClick={() => setSelectedId(null)} />
          <aside className="absolute right-0 top-0 z-[76] flex h-full w-full max-w-[720px] flex-col bg-[var(--t2-paper)] shadow-2xl">{detailEl}</aside>
        </>
      )}

      {profileOpen && profile && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setProfileOpen(false)}>
          <div className="max-h-[85vh] w-[420px] max-w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setProfileOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[18px] text-[var(--t2-muted)] hover:bg-[var(--t2-line)]" aria-label={t("common.close")}>✕</button>
            </div>
            {profile.hasProfile ? (
              <>
                <div className="-mt-6 mb-1 flex min-w-0 items-center gap-3 pr-10">
                  {profile.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImage} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-full bg-matchup/10 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[17px] font-bold text-matchup">{(profile.firstName?.[0] ?? "?").toUpperCase()}</span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-extrabold text-[var(--t2-ink)]">{profile.displayName || profile.firstName || t("tour.plStep1")}</h2>
                    {(profile.countryName || profile.country || profile.city) && (
                      <p className="truncate text-[12px] text-[var(--t2-muted)]">{[profile.countryName || (profile.country ? catName(profile.country) : ""), profile.city].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                </div>
                <p className="mb-4 text-[11px] text-[var(--t2-faint)]">{t("tour.wsIdentityFrom")}</p>
                {profileEditor}
                <div className="mt-4 border-t border-[var(--t2-line)] pt-3">
                  <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--t2-faint)]">{t("tour.suTitle")}</p>
                  <div className="space-y-0.5">
                    {[
                      { key: "passport", label: t("tour.suPassport"), done: setupSummary?.passport },
                      { key: "insurance", label: t("tour.suInsurance"), done: setupSummary?.insurance },
                      { key: "emergency", label: t("tour.suEmergency"), done: setupSummary?.emergency },
                      { key: "equipment", label: t("tour.suEquipment"), done: setupSummary?.equipment },
                    ].map((r) => (
                      <Link key={r.key} href="/tour2/profile" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-[var(--t2-surface)]">
                        <span className="text-[var(--t2-muted)]">{r.label}</span>
                        <span className={`text-[12px] font-semibold ${!setupSummary ? "text-[var(--t2-faint)]" : r.done ? "text-emerald-700" : "text-[var(--t2-faint)]"}`}>{!setupSummary ? "…" : r.done ? t("tour.suDone") : t("tour.suMissing")}</span>
                      </Link>
                    ))}
                    <Link href="/tour2/profile" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-[var(--t2-surface)]">
                      <span className="text-[var(--t2-muted)]">{t("tour.suTravelDocs")}</span>
                      <span className={`text-[12px] font-semibold ${!setupSummary ? "text-[var(--t2-faint)]" : setupSummary.travelDocs > 0 ? "text-emerald-700" : "text-[var(--t2-faint)]"}`}>{!setupSummary ? "…" : t("tour.suCount", { n: setupSummary.travelDocs })}</span>
                    </Link>
                    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px]">
                      <span className="text-[var(--t2-muted)]">{t("tour.suAge")}</span>
                      <span className="text-[12px] font-semibold text-[var(--t2-muted)]">{profile.age != null ? t("tour.suAgeVal", { n: profile.age }) : t("tour.suMissing")}</span>
                    </div>
                  </div>
                </div>
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
