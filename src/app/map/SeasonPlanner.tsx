"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  prizeFor,
  urlFor,
  tournamentLogo,
  EXTRAS,
  planSpanDays,
  type Tournament,
  type HomeBase,
} from "@/lib/tournaments";
import {
  eligibility,
  cutoffFor,
  ELIG_COLOR,
  missingDocs,
  requiredDocs,
  DOC_LABELS,
  type PlayerProfile,
  type PlayerDocs,
} from "@/lib/player";
import type { Venue } from "@/lib/venuesDb";
import { hotelUrl, flightUrl, carUrl, hotelPriceQuery, flightPriceQuery, type LivePrice } from "@/lib/travelpayouts";

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

export default function SeasonPlanner({
  planIds,
  onTogglePlan,
  start,
  setStart,
  budget,
  setBudget,
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
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Alle");
  const [surface, setSurface] = useState<(typeof SURFACES)[number]>("Alle");

  const plan = useMemo(
    () => planIds.map((id) => tours.find((t) => t.id === id)).filter(Boolean).sort(byDate as never) as Tournament[],
    [planIds, tours],
  );
  const cost = useMemo(() => computePlan(plan, start), [plan, start]);
  const inPlan = (id: string) => planIds.includes(id);

  const catalog = useMemo(() => {
    return [...tours].sort(byDate).filter((t) => {
      if (group !== "Alle" && TIER_META[t.tier].group !== group) return false;
      if (surface !== "Alle" && t.surface !== surface) return false;
      return true;
    });
  }, [group, surface, tours]);

  const sel = selTid ? tours.find((t) => t.id === selTid) ?? null : null;
  if (sel) {
    return <TournamentDetail t={sel} inPlan={inPlan(sel.id)} onToggle={() => onTogglePlan(sel.id)} onFocus={() => onFocus(sel)} onBack={() => setSelTid(null)} start={start} profile={profile} venues={venues} />;
  }

  const spentPct = budget > 0 ? Math.min(100, Math.round((cost.total / budget) * 100)) : 0;
  const remaining = budget - cost.total;
  const over = remaining < 0;
  const flights = cost.perTour.filter((p) => p.leg.mode === "Flug").length;
  const priciest = cost.perTour.reduce<(typeof cost.perTour)[number] | null>(
    (m, p) => (!m || p.leg.cost > m.leg.cost ? p : m),
    null,
  );

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
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

      {/* Status-Übersicht der geplanten Saison */}
      {plan.length > 0 && (
        <StatusOverview plan={plan} profile={profile} hasRank={hasRank} over={over} spentPct={spentPct} />
      )}

      {/* Smart-Planer */}
      <div className="rounded-2xl bg-gradient-to-br from-matchup to-indigo-600 p-4 text-white shadow-sm">
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <span>⚡</span> Smart-Planer
        </div>
        <p className="mt-0.5 text-xs text-white/80">
          Füllt automatisch die günstigste Saison für dein Budget – maximale Punkte pro Euro, minimale Flüge.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onSmartFill}
            className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-matchup shadow-sm transition hover:bg-white/90"
          >
            Günstigste Saison füllen
          </button>
          <button
            type="button"
            onClick={onCheapestStart}
            disabled={plan.length === 0}
            className="flex-1 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25 disabled:opacity-40"
          >
            Beste Startbasis
          </button>
        </div>
        {plan.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/80">
            <span>{plan.length} Turniere</span>
            <span>· {flights} {flights === 1 ? "Flug" : "Flüge"}</span>
            <span>· {cost.points.toLocaleString("de-CH")} Punkte</span>
            {priciest && <span>· teuerste Etappe: {priciest.leg.from}→{priciest.leg.to} ({fmtEUR(priciest.leg.cost)})</span>}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Budget</span>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
              className="w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-right font-bold outline-none focus:border-matchup"
            />
            <span className="font-bold text-neutral-500">€</span>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${spentPct}%`, background: over ? "#dc2626" : "#4b3bf3" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-neutral-500">Ausgaben {fmtEUR(cost.total)}</span>
          <span className={`font-bold ${over ? "text-red-600" : "text-emerald-600"}`}>
            {over ? "Über Budget " : "Rest "} {fmtEUR(Math.abs(remaining))}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <Row label="Reise (Flug/Bahn/Auto)" value={fmtEUR(cost.travel)} />
          <Row label="Hotels" value={fmtEUR(cost.hotels)} />
          <Row label="Transfers" value={fmtEUR(cost.transfers)} />
          <Row label="Nenngelder" value={fmtEUR(cost.entry)} />
        </div>
        <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
          <Stat label="Dauer" value={`${planSpanDays(plan)} T`} />
          <Stat label="Punkte bei Sieg" value={cost.points.toLocaleString("de-CH")} accent />
          <Stat label="Preisgeld bei Sieg" value={fmtEUR(cost.prize)} />
        </div>
      </div>

      {/* Startpunkt */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Startpunkt</h3>
        <div className="flex flex-wrap gap-1.5">
          {HOME_BASES.map((b) => {
            const active = b.name === start.name;
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => setStart(b)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? "bg-emerald-600 text-white shadow-sm" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
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
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Meine Saison{plan.length ? ` · ${plan.length} Stops` : ""}
        </h3>
        {plan.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 px-3 py-4 text-center text-sm text-neutral-400">
            Wähle unten Turniere aus – die Route erscheint live auf der Karte.
          </p>
        ) : (
          <ol className="space-y-1.5">
            <li className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">⌂</span>
              Start · {start.name}
            </li>
            {cost.perTour.map((p, i) => (
              <li key={p.t.id}>
                <div className="flex items-center gap-1 py-0.5 pl-2 text-[11px] text-neutral-400">
                  <span>↓ {p.leg.mode}</span>
                  <span>· {p.leg.km.toLocaleString("de-CH")} km</span>
                  <span>· {fmtEUR(p.leg.cost)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelTid(p.t.id); onFocus(p.t); }}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-left hover:border-matchup/40"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                    style={{ background: TIER_META[p.t.tier].color }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.t.name}</span>
                    <span className="block text-[11px] text-neutral-400">
                      {fmtRange(p.t)} · {TIER_META[p.t.tier].label} · {fmtEUR(p.total)}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onTogglePlan(p.t.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onTogglePlan(p.t.id); } }}
                    className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                  >
                    Entfernen
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Turniere</h3>
          {hasRank && (
            <button
              type="button"
              onClick={() => setOnlyEligible(!onlyEligible)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                onlyEligible ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {onlyEligible ? "✓ Nur für mich mögliche" : "Nur für mich mögliche"}
            </button>
          )}
        </div>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{g}</Chip>
          ))}
        </div>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {SURFACES.map((s) => (
            <Chip key={s} active={surface === s} onClick={() => setSurface(s)} subtle>
              {s === "Alle" ? "Alle Beläge" : SURFACE_LABEL[s]}
            </Chip>
          ))}
        </div>
        <div className="space-y-1.5">
          {catalog.map((t) => {
            const meta = TIER_META[t.tier];
            const added = inPlan(t.id);
            const el = hasRank ? eligibility(profile, t) : null;
            if (onlyEligible && el && el.status === "red" && !added) return null;
            return (
              <div
                key={t.id}
                className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2"
              >
                <button
                  type="button"
                  onClick={() => { setSelTid(t.id); onFocus(t); }}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: el ? ELIG_COLOR[el.status] : meta.color }} />
                  {tournamentLogo(t) ? (
                    <img src={tournamentLogo(t)!} alt="" className="h-7 w-7 shrink-0 rounded-md object-contain ring-1 ring-neutral-200" />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ background: meta.color }}>{meta.short}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t.name}</span>
                    <span className="block text-[11px] text-neutral-400">
                      {fmtRange(t)} · {t.city} · {SURFACE_LABEL[t.surface]}
                      {t.indoor ? " (Indoor)" : ""}
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: meta.color }}
                  >
                    {meta.short}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onTogglePlan(t.id)}
                  className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors ${
                    added ? "bg-emerald-50 text-emerald-600" : "bg-matchup text-white hover:bg-matchup-hover"
                  }`}
                >
                  {added ? "✓" : "+"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
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
}: {
  t: Tournament;
  inPlan: boolean;
  onToggle: () => void;
  onFocus: () => void;
  onBack: () => void;
  start: HomeBase;
  profile: PlayerProfile;
  venues: Venue[];
}) {
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
  const hotelSub = live.hotel.price != null ? `ab ${fmtEUR(live.hotel.price)}` : `${nights(t)} Nächte`;
  const flightSub = live.flight.price != null ? `ab ${fmtEUR(live.flight.price)}` : profile.homeAirport || "ab Heimat";

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-matchup hover:underline">
        ← Saison
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
            {t.city}, {t.country} · {SURFACE_LABEL[t.surface]}
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
          Trage im Profil dein Ranking und Geburtsdatum ein, um zu sehen, ob du hier teilnehmen kannst.
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
            {inPlan ? "✓ In der Saison" : "+ Zur Saison hinzufügen"}
          </button>
          <button
            type="button"
            onClick={onFocus}
            className="flex flex-1 items-center justify-center rounded-full border border-neutral-300 px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Auf Karte zeigen
          </button>
        </div>
        <a
          href={url.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-full border border-neutral-300 px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          {url.official ? "Offizielle Turnierseite ↗" : "Turnier-Infos suchen ↗"}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Fact label="Termin" value={fmtRange(t)} />
        <Fact label="Meldeschluss" value={fmtDate(entryDeadline(t))} />
        <Fact label="Preisgeld (Sieger)" value={fmtEUR(prizeFor(t))} />
        <Fact label="Aufenthalt" value={`${nights(t)} Nächte`} />
      </div>

      {/* Cut-Off (Meldeliste offiziell, sonst kalibrierter Richtwert) */}
      {(() => {
        const co = cutoffFor(t);
        return (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <div className="text-sm">
              <span className="font-semibold text-neutral-700">Cut-Off</span>
              <span className="text-neutral-500"> · Hauptfeld ~{co.direct} · Quali ~{co.quali}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${co.official ? "bg-emerald-50 text-emerald-600" : "bg-neutral-200 text-neutral-500"}`}>
              {co.official ? "offiziell" : "Richtwert"}
            </span>
          </div>
        );
      })()}

      {/* Wetter zur Turnierzeit (Klimawerte Vorjahr) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Wetter zur Turnierzeit</h3>
        {t.indoor ? (
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">
            <span>🏟️</span> Indoor-Turnier – wetterunabhängig.
          </div>
        ) : wx === "loading" ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-400">Wetterdaten werden geladen …</div>
        ) : wx === "err" ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400">Wetterdaten aktuell nicht verfügbar.</div>
        ) : (
          <>
            <div
              className="grid grid-cols-3 overflow-hidden rounded-2xl border border-neutral-200 text-center"
              style={{ background: `linear-gradient(135deg, ${wx.maxT >= 26 ? "#fff7ed" : wx.maxT >= 15 ? "#f0f9ff" : "#eef2ff"}, #ffffff)` }}
            >
              <div className="px-2 py-3">
                <div className="text-lg">{wx.maxT >= 28 ? "🔥" : wx.maxT >= 18 ? "☀️" : wx.maxT >= 8 ? "⛅" : "❄️"}</div>
                <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-800">{wx.maxT}°</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Tag Ø</div>
              </div>
              <div className="border-x border-neutral-100 px-2 py-3">
                <div className="text-lg">🌙</div>
                <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-800">{wx.minT}°</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Nacht Ø</div>
              </div>
              <div className="px-2 py-3">
                <div className="text-lg">{wx.rainDays >= 3 ? "🌧️" : wx.rainDays >= 1 ? "🌦️" : "💧"}</div>
                <div className="mt-0.5 text-xl font-extrabold tracking-tight text-neutral-800">{wx.rainDays}</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Regentage</div>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-400">Ø der Vorsaison am Austragungsort · Quelle: Open-Meteo</p>
          </>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Punkte je Runde</h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          {meta.points.map((p, i) => (
            <div key={i} className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 text-sm last:border-0">
              <span className="text-neutral-500">{ROUND_LABELS[i]}</span>
              <span className="font-bold">{p} Pkt</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Benötigte Dokumente</h3>
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
                {ok ? "✔" : "⚠"} {DOC_LABELS[k]}
              </span>
            );
          })}
        </div>
        {missing.length > 0 && (
          <p className="mt-2 text-xs text-red-600">
            ⚠ Fehlt: {missing.map((k) => DOC_LABELS[k]).join(", ")} — im Profil abhaken.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Kosten ab {start.name}</h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <Line label={`Anreise (${cost.leg.mode}, ${cost.leg.km.toLocaleString("de-CH")} km)`} value={fmtEUR(cost.leg.cost)} />
          <Line label={`Hotel (${cost.nights} Nächte)`} value={fmtEUR(cost.hotel)} />
          <Line label="Transfer" value={fmtEUR(cost.transfer)} />
          {cost.entry > 0 && <Line label="Nenngeld" value={fmtEUR(cost.entry)} />}
          <div className="flex items-center justify-between bg-neutral-50 px-3 py-2.5 text-sm font-bold">
            <span>Gesamt</span>
            <span>{fmtEUR(cost.total)}</span>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-400">Richtwerte (Distanz &amp; Kategorie). Live-Preise beim Anbieter buchen ↓</p>
      </div>

      {/* Unterkunft & Transfer – Deep-Links (Buchung beim Anbieter, für Turnierdaten vorausgefüllt) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Unterkunft &amp; Transfer</h3>
        <div className="grid grid-cols-3 gap-2">
          <BookLink href={bookingUrl} icon="🏨" label="Hotels" sub={hotelSub} live={live.hotel.price != null} />
          <BookLink href={flightLink} icon="✈️" label="Flüge" sub={flightSub} live={live.flight.price != null} />
          <BookLink href={carLink} icon="🚗" label="Mietwagen" sub={t.city} />
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-400">
          {live.hotel.price != null || live.flight.price != null
            ? "Echte Preise (ab), tagesaktuell. Öffnet den Anbieter in neuem Tab."
            : "Vorausgefüllt mit Ort & Turnierdaten. Öffnet den Anbieter in neuem Tab."}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Vor Ort</h3>
        <div className="flex flex-wrap gap-1.5">
          {EXTRAS[t.tier].map((x) => (
            <span key={x} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">✔ {x}</span>
          ))}
        </div>
      </div>

      {/* Rund ums Turnier (OSM) */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Rund ums Turnier</h3>
        <POINearby pois={pois} />
      </div>

      {nearby.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Trainingsplätze in der Nähe</h3>
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
                  <span className="block text-[11px] text-neutral-400">{v.city ? `${v.city} · ` : ""}{km} km entfernt</span>
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
      <span className="min-w-0 text-neutral-500">{label}</span>
      <span className="shrink-0 whitespace-nowrap font-semibold text-neutral-700">{value}</span>
    </div>
  );
}
function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex-1 rounded-xl px-3 py-2 ${accent ? "bg-matchup/10" : "bg-neutral-50"}`}>
      <div className={`text-sm font-extrabold ${accent ? "text-matchup" : "text-neutral-800"}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{label}</div>
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
              <stop offset="0%" stopColor="#4b3bf3" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={R} fill="none" stroke="#eceaff" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={R} fill="none" stroke={`url(#${gid})`} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={off} className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
              style={{ background: "linear-gradient(135deg, #4b3bf3, #8b5cf6)" }}
            >
              {/* Matchup-Mark (weiss) sobald dieser Punkt vollständig ist */}
              <img src="/icon-192.png" alt="" className="h-4 w-4" style={{ filter: "brightness(0) invert(1)" }} />
            </span>
          ) : (
            <span className="text-sm font-extrabold text-matchup">{Math.round(p)}%</span>
          )}
        </div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-[11px] font-bold text-neutral-700">{label}</div>
        <div className="text-[10px] text-neutral-400">{value}</div>
      </div>
    </div>
  );
}

function StatusOverview({ plan, profile, hasRank, over, spentPct }: { plan: Tournament[]; profile: PlayerProfile; hasRank: boolean; over: boolean; spentPct: number }) {
  const reds = hasRank ? plan.map((t) => eligibility(profile, t).status).filter((s) => s === "red").length : 0;
  const miss = plan.length ? missingDocs(profile, plan[0]) : [];
  const reqCount = plan.length ? requiredDocs(plan[0]).length : 4;
  const docsOk = miss.length === 0;

  const rows: { label: string; value: string; pct: number; done: boolean }[] = [
    {
      label: "Teilnahme",
      value: !hasRank ? "Ranking fehlt" : reds === 0 ? "Alle möglich" : `${reds} offen`,
      pct: !hasRank ? 6 : plan.length ? Math.round(((plan.length - reds) / plan.length) * 100) : 100,
      done: hasRank && reds === 0,
    },
    {
      label: "Unterlagen",
      value: docsOk ? "Vollständig" : `${miss.length}/${reqCount} fehlen`,
      pct: Math.round(((reqCount - miss.length) / reqCount) * 100),
      done: docsOk,
    },
    {
      label: "Budget",
      value: over ? "Über Budget" : "Ausreichend",
      pct: over ? 42 : 100,
      done: !over,
    },
  ];
  const ready = rows.filter((r) => r.done).length;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Saison-Status</span>
        <span className="rounded-full bg-matchup/10 px-2 py-0.5 text-[11px] font-bold text-matchup">{ready} / 3 bereit</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {rows.map((r, i) => (
          <StatusRing key={r.label} id={i} label={r.label} value={r.value} pct={r.pct} done={r.done} />
        ))}
      </div>
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
  const [mode, setMode] = useState<"in" | "up">("up");
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (synced) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="min-w-0 text-[12px] text-emerald-700">
          ☁ Gesichert als <b className="break-all">{email ?? "deinem Konto"}</b>
        </span>
        <button type="button" onClick={() => void onSignOut()} className="shrink-0 text-[11px] font-bold text-emerald-700 hover:underline">
          Abmelden
        </button>
      </div>
    );
  }

  const submit = async () => {
    if (!em || pw.length < 6) {
      setMsg({ ok: false, text: "E-Mail und Passwort (mind. 6 Zeichen) eingeben." });
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
      setMsg({ ok: true, text: "Fast fertig – bestätige den Link in deiner E-Mail, dann ist dein Profil gesichert." });
      setPw("");
    }
    // Erfolg mit Session: onAuthStateChange schaltet automatisch auf „gesichert".
  };

  return (
    <div className="rounded-xl bg-indigo-50 p-3">
      <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-bold text-indigo-700">🔒 Profil mit Passwort sichern</div>
      <p className="mb-2 text-[11px] text-indigo-700/80">Dieselbe Anmeldung wie in der Matchup-App – danach ist dein Profil (inkl. Bild) auf allen Geräten verfügbar.</p>
      <div className="space-y-1.5">
        <input type="email" value={em} onChange={(e) => setEm(e.target.value)} placeholder="E-Mail" autoComplete="email" className="mu-in" />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Passwort"
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
        {busy ? "…" : mode === "up" ? "Registrieren & sichern" : "Anmelden"}
      </button>
      <button
        type="button"
        onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(null); }}
        className="mt-1.5 block w-full text-center text-[11px] font-semibold text-indigo-700 hover:underline"
      >
        {mode === "up" ? "Ich habe schon ein Konto → Anmelden" : "Neu hier? → Konto erstellen"}
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
  const set = <K extends keyof PlayerProfile>(k: K, v: PlayerProfile[K]) => setProfile({ ...profile, [k]: v });
  const setDoc = (k: keyof PlayerDocs, v: boolean) => setProfile({ ...profile, docs: { ...profile.docs, [k]: v } });
  const num = (v: string) => (v === "" ? null : Math.max(1, Math.round(Number(v)) || 0));
  const rankSummary = profile.atp ? `ATP ${profile.atp}` : profile.wta ? `WTA ${profile.wta}` : profile.itf ? `ITF ${profile.itf}` : "kein Ranking";
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Spielerprofil";
  const initials = (profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "");

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-3 text-left">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-neutral-200" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-sm font-extrabold text-matchup">
            {initials || "👤"}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{name}</span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                synced ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
              }`}
              title={synced ? "Mit deinem Matchup-Konto synchronisiert – auf allen Geräten verfügbar" : "Lokal auf diesem Gerät gespeichert – mit Passwort sichern für geräteübergreifenden Sync"}
            >
              {synced ? "☁ Konto" : "Lokal"}
            </span>
          </span>
          <span className="block text-xs text-neutral-400">{rankSummary}{profile.nationality ? ` · ${profile.nationality}` : ""}</span>
        </span>
        <span className="text-xs font-semibold text-matchup">{open ? "Schliessen" : "Bearbeiten"}</span>
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
                {profile.avatar ? "Bild ändern" : "Profilbild hochladen"}
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
                  Entfernen
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Vorname"><input value={profile.firstName} onChange={(e) => set("firstName", e.target.value)} className="mu-in" /></Field>
            <Field label="Nachname"><input value={profile.lastName} onChange={(e) => set("lastName", e.target.value)} className="mu-in" /></Field>
            <Field label="Nationalität"><input value={profile.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="z.B. Deutschland" className="mu-in" /></Field>
            <Field label="Geburtsdatum"><input type="date" value={profile.birthdate} onChange={(e) => set("birthdate", e.target.value)} className="mu-in" /></Field>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">Geschlecht</div>
            <div className="flex gap-1.5">
              <Chip active={profile.gender === "m"} onClick={() => set("gender", "m")}>Herren</Chip>
              <Chip active={profile.gender === "w"} onClick={() => set("gender", "w")}>Damen</Chip>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Field label="ATP"><input inputMode="numeric" value={profile.atp ?? ""} onChange={(e) => set("atp", num(e.target.value))} className="mu-in" /></Field>
            <Field label="WTA"><input inputMode="numeric" value={profile.wta ?? ""} onChange={(e) => set("wta", num(e.target.value))} className="mu-in" /></Field>
            <Field label="ITF"><input inputMode="numeric" value={profile.itf ?? ""} onChange={(e) => set("itf", num(e.target.value))} className="mu-in" /></Field>
            <Field label="UTR"><input inputMode="numeric" value={profile.utr ?? ""} onChange={(e) => set("utr", num(e.target.value))} className="mu-in" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Heimatflughafen"><input value={profile.homeAirport} onChange={(e) => set("homeAirport", e.target.value)} placeholder="z.B. FRA" className="mu-in" /></Field>
            <Field label="Wohnort"><input value={profile.homeCity} onChange={(e) => set("homeCity", e.target.value)} className="mu-in" /></Field>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">Dokumente (vorhanden abhaken)</div>
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
                  {profile.docs[k] ? "✔ " : ""}{DOC_LABELS[k]}
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
type PoiCats = Record<"food" | "physio" | "fitness" | "pharmacy" | "supermarket", Poi[]>;
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
  { key: "fitness", icon: "🏋️", label: "Fitness & Sportcenter" },
  { key: "supermarket", icon: "🛒", label: "Supermarkt" },
  { key: "pharmacy", icon: "💊", label: "Apotheke" },
];
function fmtDist(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}
function POINearby({ pois }: { pois: PoiCats | "loading" | "err" }) {
  if (pois === "loading") return <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-400">Umgebung wird geladen …</div>;
  if (pois === "err") return <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400">Umgebungsdaten aktuell nicht verfügbar.</div>;
  const groups = POI_META.filter((m) => pois[m.key]?.length);
  if (!groups.length) return <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400">Keine Einträge im Umkreis gefunden.</div>;
  return (
    <div className="space-y-3">
      {groups.map((m) => (
        <div key={m.key}>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-neutral-500">
            <span>{m.icon}</span> {m.label}
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
      <p className="text-[11px] text-neutral-400">Umkreis ~3 km · Quelle: OpenStreetMap</p>
    </div>
  );
}

function BookLink({ href, icon, label, sub, live = false }: { href: string; icon: string; label: string; sub: string; live?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`relative flex flex-col items-center gap-1 rounded-2xl border bg-white px-2 py-3 text-center transition hover:shadow-sm ${
        live ? "border-matchup/40" : "border-neutral-200 hover:border-matchup/40"
      }`}
    >
      {live && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" title="Live-Preis" />
      )}
      <span className="text-xl">{icon}</span>
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

function Chip({ children, active, onClick, subtle = false }: { children: ReactNode; active: boolean; onClick: () => void; subtle?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active ? (subtle ? "bg-neutral-900 text-white" : "bg-matchup text-white shadow-sm") : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}
