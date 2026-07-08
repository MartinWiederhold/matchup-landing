"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  TOURNAMENTS,
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
  type Tournament,
  type HomeBase,
} from "@/lib/tournaments";

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
}) {
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Alle");
  const [surface, setSurface] = useState<(typeof SURFACES)[number]>("Alle");

  const plan = useMemo(
    () => planIds.map((id) => TOURNAMENTS.find((t) => t.id === id)).filter(Boolean).sort(byDate as never) as Tournament[],
    [planIds],
  );
  const cost = useMemo(() => computePlan(plan, start), [plan, start]);
  const inPlan = (id: string) => planIds.includes(id);

  const catalog = useMemo(() => {
    return [...TOURNAMENTS].sort(byDate).filter((t) => {
      if (group !== "Alle" && TIER_META[t.tier].group !== group) return false;
      if (surface !== "Alle" && t.surface !== surface) return false;
      return true;
    });
  }, [group, surface]);

  const sel = selTid ? TOURNAMENTS.find((t) => t.id === selTid) ?? null : null;
  if (sel) {
    return <TournamentDetail t={sel} inPlan={inPlan(sel.id)} onToggle={() => onTogglePlan(sel.id)} onFocus={() => onFocus(sel)} onBack={() => setSelTid(null)} start={start} />;
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
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Turniere</h3>
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
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
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
}: {
  t: Tournament;
  inPlan: boolean;
  onToggle: () => void;
  onFocus: () => void;
  onBack: () => void;
  start: HomeBase;
}) {
  const meta = TIER_META[t.tier];
  const cost = computePlan([t], start).perTour[0];
  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-matchup hover:underline">
        ← Saison
      </button>
      <div>
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: meta.color }}>
          {meta.label}
        </span>
        <h2 className="mt-1.5 text-xl font-bold leading-tight tracking-tight">{t.name}</h2>
        <p className="text-sm text-neutral-500">
          {t.city}, {t.country} · {SURFACE_LABEL[t.surface]}
          {t.indoor ? " (Indoor)" : " (Outdoor)"}
        </p>
      </div>

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

      <div className="grid grid-cols-2 gap-2">
        <Fact label="Termin" value={fmtRange(t)} />
        <Fact label="Meldeschluss" value={fmtDate(entryDeadline(t))} />
        <Fact label="Preisgeld (Sieger)" value={fmtEUR(meta.prize)} />
        <Fact label="Aufenthalt" value={`${nights(t)} Nächte`} />
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
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-neutral-700">{value}</span>
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
