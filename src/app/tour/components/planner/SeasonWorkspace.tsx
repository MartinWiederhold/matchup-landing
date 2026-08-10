"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { COUNTRY_CODES } from "@/lib/i18n/messages/tour";
import { loadPlannerProfile, loadActiveTournaments, tournamentsInFrame, placeKey, ratesToCostParams, budgetMoney, buildSeasonCandidates, costRatesComplete, type PlannerProfile, type Frame } from "@/lib/tourPlanner";
import { loadSeasonTournamentIds, addToSeason, removeFromSeason } from "@/lib/tourSeason";
import { saveWhoAmI, saveSeasonBudget } from "@/lib/tourSetup";
import { loadCostRates, type CostRatesPatch } from "@/lib/tourCosts";
import { loadStays } from "@/lib/tourStays";
import { hasSchengenPassport } from "@/lib/visa";
import { bannedDestinations } from "@/lib/tourVisaRequirements";
import { computeSeasonCost } from "@/domain/tour/costs";
import { optimizeSeason } from "@/domain/tour/optimizeSeason";
import { schengenUsage, isSchengenCode, type Stay, type SchengenUsage } from "@/domain/tour/schengen";
import CostRatesForm from "@/app/tour/costs/components/CostRatesForm";
import { DeadlineCountdown } from "../EntryDeadline";
import type { TourTournament, TourCostRates } from "@/lib/types";
import PlannerMap, { type PlanStop, type CandPoint, type MapStart } from "./PlannerMap";
import TournamentDetail from "./TournamentDetail";

const DAY = 86_400_000;
const NIGHTS_KEY = "mu_tour_nights";

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
type CityOpt = { city: string; country: string | null; lat: number; lng: number };

export default function SeasonWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [profile, setProfile] = useState<PlannerProfile | null>(null);
  const [tours, setTours] = useState<TourTournament[]>([]);
  const [seasonIds, setSeasonIds] = useState<Set<string>>(new Set());
  const [banned, setBanned] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(true);

  // Profil (aufklappbar) + Ranking-Bearbeitung.
  const [profileOpen, setProfileOpen] = useState(false);
  const [rankingInput, setRankingInput] = useState("");

  // Startpunkt: Suche + gewählter Startpunkt (Session; überschreibt das Profil für die Route).
  const [startPick, setStartPick] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [locQuery, setLocQuery] = useState("");
  const [recent, setRecent] = useState<{ name: string; lat: number; lng: number }[]>([]);

  // Rahmen (Budget, Zeitraum, Region/Länder). Länder-Dropdown-Zustand.
  const [frame, setFrame] = useState<Frame>(() => ({ region: "europe", from: new Date().toISOString().slice(0, 10), to: "", countries: [] }));
  const [budget, setBudget] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryBoxRef = useRef<HTMLDivElement>(null);

  // Etappe 3: Kostensätze, Nächte-Annahme, Schengen-Aufenthalte, Smart-Fill-Zustand.
  const [rates, setRates] = useState<TourCostRates | null>(null);
  const [nights, setNights] = useState<string>(() => { try { return localStorage.getItem(NIGHTS_KEY) ?? ""; } catch { return ""; } });
  const [stays, setStays] = useState<Stay[]>([]);
  const [filling, setFilling] = useState(false);
  const [costOpen, setCostOpen] = useState(false); // Kostensätze/Nächte bearbeiten (aufklappbar, wenn Sätze schon da sind)
  const [nowMs] = useState(() => Date.now()); // Stichtag für den Meldefrist-Countdown (aus der Komponente)

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [p, ts, ids, cr] = await Promise.all([loadPlannerProfile(user.id), loadActiveTournaments(), loadSeasonTournamentIds(), loadCostRates()]);
        if (!alive) return;
        setProfile(p);
        setTours(ts);
        setSeasonIds(ids);
        setRates(cr);
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

  // ── Startpunkt-Vorschläge: eindeutige Turnierorte mit Koordinaten ──────────────
  const cityOptions = useMemo(() => {
    const m = new Map<string, CityOpt>();
    for (const tt of tours) {
      if (!hasCoords(tt) || !tt.city) continue;
      const k = `${tt.country}|${tt.city}`;
      if (!m.has(k)) m.set(k, { city: tt.city, country: tt.country, lat: tt.latitude as number, lng: tt.longitude as number });
    }
    return [...m.values()];
  }, [tours]);
  const locMatches = useMemo(() => {
    const q = locQuery.trim().toLowerCase();
    if (!q) return [];
    return cityOptions.filter((c) => c.city.toLowerCase().includes(q) || (catName(c.country).toLowerCase().includes(q))).slice(0, 8);
  }, [locQuery, cityOptions, catName]);

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
    (inSeason ? removeFromSeason(id) : addToSeason(user.id, id)).catch(() => {
      setSeasonIds((cur) => { const rb = new Set(cur); if (inSeason) rb.add(id); else rb.delete(id); return rb; });
    });
  }, [user, seasonIds]);

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
      const candidates = buildSeasonCandidates(tours, frame, new Set(), new Set());
      const result = optimizeSeason({
        candidates,
        budget: budgetM,
        params,
        homePlace,
        nightsPerWeek: nights.trim() === "" ? null : nightsNum,
        now: new Date(),
        schengen: schengenApplies ? { applies: true, existingStays: stays } : null,
        entryBanned: banned,
      });
      const newIds = new Set(result.picks.map((p) => p.id));
      const cur0 = seasonIds;
      const toRemove = [...cur0].filter((id) => !newIds.has(id));
      const toAdd = [...newIds].filter((id) => !cur0.has(id));
      setSeasonIds(newIds); // optimistisch
      await Promise.all([...toRemove.map((id) => removeFromSeason(id)), ...toAdd.map((id) => addToSeason(user.id, id))]);
    } catch {
      // Bei Fehler den echten Stand zurückholen, damit Anzeige und DB nicht auseinanderlaufen.
      try { setSeasonIds(await loadSeasonTournamentIds()); } catch { /* egal */ }
    } finally {
      setFilling(false);
    }
  }, [user, filling, rates, budget, profile, tours, frame, nights, nightsNum, schengenApplies, stays, banned, seasonIds]);

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

  // Wohnland (profiles.country) — steuert die Heimatnähe des Optimierers (country|city).
  const saveCountry = useCallback((iso: string) => {
    if (!user) return;
    const value = iso || null;
    setProfile((p) => (p ? { ...p, country: value } : p)); // optimistisch
    void saveWhoAmI(user.id, { country: value });
  }, [user]);

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

  // ── Auth-Gate ────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-neutral-500">{t("tour.loading")}</div>;
  if (!user) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="max-w-sm text-sm text-neutral-500">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-2 inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }

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

  // Anzeigewerte für die Kosten-Sektion (reine Ableitungen, keine Systemzeit).
  const ratesDone = costRatesComplete(rates);
  const cur = rates?.currency ?? "EUR";
  const weekCostMinor = ratesDone ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nightsNum + (rates!.food_per_day_minor ?? 0) * nightsNum + (rates!.coach_per_week_minor ?? 0) : 0;
  const spentMinor = cost ? (cost.total[cur] ?? 0) : 0;
  const budgetLeftMinor = budgetMinor ? budgetMinor.amount - spentMinor : null;
  const budgetPct = budgetMinor && budgetMinor.amount > 0 ? Math.min(100, Math.round((spentMinor / budgetMinor.amount) * 100)) : 0;

  const panel = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-neutral-200 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
        <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">{t("tour.plTitle")}</h1>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {status === "loading" && <p className="text-sm text-neutral-500">{t("tour.loading")}</p>}
        {status === "error" && <p className="text-sm text-neutral-500">{t("tour.loadError")}</p>}

        {status === "ready" && profile && (
          <>
            {/* 1) Profil (eingeklappt, aufklappbar) */}
            <section className="rounded-2xl bg-black/[0.02] ring-1 ring-black/5">
              <button type="button" onClick={() => setProfileOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-matchup/10 text-[13px] font-bold text-matchup">{(profile.firstName?.[0] ?? "?").toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-neutral-900">{profile.firstName || t("tour.plStep1")}</span>
                  <span className="block truncate text-[12px] text-neutral-500">
                    {profile.ranking != null ? `${t("tour.rankLabel")} ${profile.ranking}` : t("tour.noRank")}
                    {profile.country ? ` · ${catName(profile.country)}` : ""}
                    {profile.passports.length ? ` · ${t("tour.plChipPass")}: ${profile.passports.join(", ")}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-semibold text-matchup">{profileOpen ? t("tour.plEdit") : t("tour.plEdit")}</span>
              </button>
              {profileOpen && (
                <div className="space-y-3 border-t border-black/[0.06] p-4">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.rankLabel")}</span>
                    <div className="flex gap-2">
                      <input value={rankingInput} onChange={(e) => setRankingInput(e.target.value)} inputMode="numeric" placeholder="—" className={inp} />
                      <button type="button" onClick={saveRanking} className="shrink-0 rounded-xl bg-neutral-900 px-4 text-[13px] font-bold text-white hover:bg-neutral-700">{t("common.save")}</button>
                    </div>
                  </label>

                  {/* Wohnland */}
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.wsHome")}</span>
                    <select value={profile.country ?? ""} onChange={(e) => saveCountry(e.target.value)} className={inp}>
                      <option value="">—</option>
                      {COUNTRY_CODES.map((c) => <option key={c} value={c}>{catName(c)}</option>)}
                    </select>
                  </label>

                  {/* Pässe (Nationalität) — Chips zum Entfernen + Auswahl zum Hinzufügen */}
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
                </div>
              )}
            </section>

            {/* 2) Startpunkt: Suche + Chips */}
            <section>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsStartTitle")}</h2>
              <div className="relative mt-2">
                <input value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder={startName ? t("tour.wsStartCurrent", { name: startName }) : t("tour.wsStartSearch")} className={inp} />
                {locMatches.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">
                    {locMatches.map((c) => (
                      <li key={`${c.country}|${c.city}`}>
                        <button type="button" onClick={() => pickStart({ name: c.city, lat: c.lat, lng: c.lng })} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03]">
                          <span className="truncate font-semibold text-neutral-900">{c.city}</span>
                          <span className="shrink-0 text-[11px] text-neutral-400">{catName(c.country)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {recent.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recent.map((r) => (
                    <button key={r.name} type="button" onClick={() => pickStart(r)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${startName === r.name ? "bg-emerald-500/10 text-emerald-700 ring-emerald-200" : "bg-white text-neutral-600 ring-black/10 hover:bg-black/[0.03]"}`}>
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 3) Rahmen: Budget, Zeitraum, Länder-Mehrfachauswahl mit Zählern */}
            <section className="space-y-3">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.plStep2")}</h2>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plBudget")}</span>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" placeholder="—" className={inp} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plFrom")}</span>
                  <input type="date" value={frame.from} onChange={(e) => setFrame((f) => ({ ...f, from: e.target.value }))} className={inp} /></label>
                <label className="block"><span className="mb-1 block text-[12px] font-semibold text-neutral-600">{t("tour.plTo")}</span>
                  <input type="date" value={frame.to} onChange={(e) => setFrame((f) => ({ ...f, to: e.target.value }))} className={inp} /></label>
              </div>

              <div>
                <span className="mb-1.5 block text-[12px] font-semibold text-neutral-600">{t("tour.plRegion")}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={() => setFrame((f) => ({ ...f, region: "all", countries: [] }))} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${selCountries.length === 0 && frame.region === "all" ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t("tour.plRegionAll")}</button>
                  <button type="button" onClick={() => setFrame((f) => ({ ...f, region: "europe", countries: [] }))} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${selCountries.length === 0 && frame.region === "europe" ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t("tour.plRegionEurope")}</button>

                  {/* Länder-Mehrfachauswahl mit Turnierzahl je Land */}
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
            </section>

            {/* 4) Kosten & Status (reaktiv) + günstigste Saison füllen */}
            <section className="space-y-3">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsCostTitle")}</h2>

              {!ratesDone ? (
                <>
                  <p className="text-[12px] leading-relaxed text-neutral-500">{t("tour.wsCostNeedRates")}</p>
                  <CostRatesForm rates={rates} userId={user.id} onSaved={onRatesSaved} nights={nights} onNightsChange={setNights} />
                </>
              ) : (
                <>
                  <p className="text-[12px] leading-relaxed text-neutral-500">{t("tour.wsWeekCost", { amount: money(weekCostMinor, cur) })}</p>

                  {cost && cost.stations.length > 0 && (
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
                      {cost.arrivalsSaved > 0 && <p className="mt-1.5 text-[12px] text-emerald-600">{t("tour.wsArrivalsSaved", { n: cost.arrivalsSaved })}</p>}
                      {cost.hasUnknown && <p className="mt-1 text-[12px] text-neutral-400">{t("tour.wsCostUnknown")}</p>}
                    </div>
                  )}

                  {schengen && (schengen.exceeds ? (
                    // Grenze gerissen = Problem, nicht Detail: eigener Warnblock mit Handlungshinweis
                    // (Bernstein, kein Alarmrot/Blinken — Designsprache wie NextDeadline/tourUi).
                    <div className="rounded-2xl border border-amber-300 bg-amber-500/10 p-3">
                      <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-800"><span aria-hidden>⚠</span> {t("tour.wsSchengenTitle")}</p>
                      <p className="mt-0.5 text-[12px] font-semibold text-amber-700">{t("tour.wsSchengenExceed", { used: schengen.used, over: schengen.used - 90 })}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-amber-700/90">{t("tour.wsSchengenAction")}</p>
                    </div>
                  ) : (
                    <div className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${schengen.used >= 80 ? "bg-amber-500/10 text-amber-700" : "bg-black/[0.03] text-neutral-600"}`}>
                      {t("tour.wsSchengen", { used: schengen.used })} · {t("tour.wsSchengenLeft", { n: schengen.left })}
                    </div>
                  ))}

                  <button type="button" onClick={() => setCostOpen((o) => !o)} className="text-[12px] font-semibold text-matchup hover:underline">{t("tour.wsEditRates")}</button>
                  {costOpen && <CostRatesForm rates={rates} userId={user.id} onSaved={onRatesSaved} nights={nights} onNightsChange={setNights} />}
                </>
              )}

              <button type="button" onClick={smartFill} disabled={filling || !ratesDone}
                className="w-full rounded-full bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-neutral-700 disabled:opacity-40">
                {filling ? t("tour.wsFilling") : t("tour.wsFill")}
              </button>
              <p className="text-[11px] leading-relaxed text-neutral-400">{t("tour.wsFillHint")}</p>
            </section>

            {/* Meine Saison */}
            <section>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsSeasonTitle")} · {seasonOrdered.length}</h2>
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
    </div>
  );

  // Detail statt Planer-Fläche, sobald ein Turnier gewählt ist (Desktop + Mobile-Sheet).
  // key=tt.id → beim Wechsel neu gemountet (Live-Preis wird genau einmal je Turnier geholt).
  const selectedTt = selectedId ? byId.get(selectedId) : undefined;
  const surface = selectedTt ? (
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
    />
  ) : panel;

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-white text-neutral-900">
      <aside className="hidden w-[440px] shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">{surface}</aside>
      <div className="relative flex-1 bg-neutral-100">
        <PlannerMap start={start} plan={planStops} candidates={candidateStops} selectedId={selectedId} onSelect={handleSelect} />
      </div>
      <div className={`absolute inset-x-0 bottom-0 z-[60] flex h-[62%] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] md:hidden ${sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-44px)]"}`}>
        <button type="button" onClick={() => setSheetOpen((o) => !o)} aria-expanded={sheetOpen} className="flex h-11 shrink-0 items-center justify-center gap-2 border-b border-neutral-100 text-[13px] font-bold text-neutral-700">
          {t("tour.plTitle")}<span aria-hidden className={`transition-transform ${sheetOpen ? "" : "rotate-180"}`}>▾</span>
        </button>
        <div className="min-h-0 flex-1">{surface}</div>
      </div>
    </div>
  );
}
