"use client";

/**
 * Heute als ein Place: Luftbild + schwebende echte Angaben. Keine erfundenen
 * Kennzahlen. Andere Stops nur als Ortswechsel (wie Loch zu Loch).
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { ActionItem } from "@/domain/tour/actionBoard";
import { displayCity } from "@/domain/tour/displayCity";
import { nodeById } from "@/domain/tour/siteWorld";
import { tour2ActionHref, tour2PlannerTournamentHref, T2_FINDER, T2_SEASON } from "@/app/tour2/components/t2Action";
import type { TourTournament } from "@/lib/types";
import { loadPlayerMaster, type PlayerEquipment } from "@/lib/tourPlayerMaster";
import { authoredWorlds, worldById } from "@/app/tour2/worlds/catalog";
import SiteWorld from "@/app/tour2/components/world/SiteWorld";
import SiteCard from "@/app/tour2/components/world/SiteCard";
import { loadAround, type AroundHit } from "@/app/tour2/components/world/loadAround";
import PlaceMap, { type PlacePin } from "./PlaceMap";

export type PlaceStop = {
  id: string;
  city: string;
  monday: string;
  lat: number | null;
  lng: number | null;
  year: number;
};

const YEAR_FILTERS = [2026, 2027] as const;
const WORLD_PIN = "world:";

function actionText(
  t: (k: string, v?: Record<string, string | number>) => string,
  a: ActionItem,
  countryName: (c: string | null) => string,
  fmtDate: (iso: string) => string,
  money: (minor: number) => string,
): string {
  const p = a.params;
  if (a.kind === "doc_expired" || a.kind === "doc_expiring") {
    return t(`tour.docWarn_${p.kind}`, { date: p.date ?? "", days: p.days ?? 0, dest: p.dest ? countryName(String(p.dest)) : "" });
  }
  if (a.kind === "budget_over") return t("tour.action_budget_over", { amount: money(Number(p.amount)) });
  if (a.kind === "entry_banned") return t("tour.action_entry_banned", { city: displayCity(typeof p.city === "string" ? p.city : ""), dest: countryName(String(p.dest)) });
  if (a.kind === "points_expiring") return t("tour.action_points_expiring", { points: p.points ?? 0, date: fmtDate(String(p.date)) });
  if (a.kind === "visa_lead") return t("tour.action_visa_lead", { city: displayCity(typeof p.city === "string" ? p.city : ""), dest: countryName(String(p.dest)), weeks: p.weeks ?? 0, lead: p.lead ?? 0 });
  return t(`tour.action_${a.kind}`, p);
}

export default function PlaceStage({
  tournament,
  deadlineLabel,
  surfaceLabel,
  countryLabel,
  actions,
  stops,
  onFocus,
  countryName,
  fmtDate,
  money,
  children,
}: {
  tournament: TourTournament | null;
  deadlineLabel: string | null;
  surfaceLabel: string | null;
  countryLabel: string;
  actions: ActionItem[];
  stops: PlaceStop[];
  onFocus: (id: string) => void;
  countryName: (c: string | null) => string;
  fmtDate: (iso: string) => string;
  money: (minor: number) => string;
  children?: ReactNode;
}) {
  const t = useT();
  const { user } = useAuth();
  const [worldId, setWorldId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState("ashe");
  const [yearOn, setYearOn] = useState<Record<number, boolean>>({ 2026: true, 2027: true });
  const [around, setAround] = useState<AroundHit[]>([]);
  const [equipment, setEquipment] = useState<PlayerEquipment | null>(null);
  const world = worldId ? worldById(worldId) : null;
  const node = world ? (nodeById(world, nodeId) ?? world.nodes[0]) : null;

  const pins: PlacePin[] = [];
  for (const s of stops) {
    if (!yearOn[s.year] || s.lat == null || s.lng == null) continue;
    pins.push({ id: s.id, lat: s.lat, lng: s.lng, label: s.city, tone: "season" });
  }
  for (const w of authoredWorlds()) {
    if (!yearOn[w.year]) continue;
    pins.push({
      id: `${WORLD_PIN}${w.id}`,
      lat: w.origin.lat,
      lng: w.origin.lng,
      label: t("tour.t2worldTitle", { title: w.title, year: w.year }),
      tone: "world",
    });
  }

  const openWorld = (id: string) => {
    setWorldId(id);
    setNodeId("ashe");
  };
  const onMapSelect = (id: string) => {
    if (id.startsWith(WORLD_PIN)) openWorld(id.slice(WORLD_PIN.length));
    else onFocus(id);
  };

  useEffect(() => {
    if (!world) return;
    let stop = false;
    loadAround(world).then((rows) => { if (!stop) setAround(rows); }).catch(() => { if (!stop) setAround([]); });
    return () => { stop = true; };
  }, [world]);

  useEffect(() => {
    if (!user || !world) return;
    let stop = false;
    loadPlayerMaster(user.id).then((m) => { if (!stop) setEquipment(m.equipment); }).catch(() => { /* optional */ });
    return () => { stop = true; };
  }, [user, world]);

  const city = tournament
    ? (displayCity(tournament.city) || tournament.name || t("tour.fieldMissing"))
    : t("tour.t2cpEmptyRouteTitle");
  const hasGeo = tournament != null && tournament.latitude != null && tournament.longitude != null;
  const mapsHref = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${tournament.latitude},${tournament.longitude}`
    : null;
  const here = tournament
    ? actions.filter((a) => a.target.type === "tournament" && a.target.id === tournament.id).slice(0, 3)
    : [];
  const rest = tournament
    ? actions.filter((a) => !(a.target.type === "tournament" && a.target.id === tournament.id)).slice(0, 2)
    : [];

  return (
    <div className="t2-place relative min-h-0 flex-1 overflow-hidden">
      {world ? (
        <SiteWorld world={world} focusId={node?.id ?? null} onFocus={setNodeId} />
      ) : (
        <PlaceMap pins={pins} selectedId={tournament?.id ?? null} onSelect={onMapSelect} />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2" aria-label={t("tour.t2mapYears")}>
          {world ? (
            <>
              <button type="button" className="t2-place-pill" onClick={() => setWorldId(null)}>
                {t("tour.t2worldBackMap")}
              </button>
              <p className="t2-place-pill is-soft">{t("tour.t2worldTitle", { title: world.title, year: world.year })}</p>
            </>
          ) : (
            <>
              {YEAR_FILTERS.map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={yearOn[y]}
                  className={`t2-place-pill ${yearOn[y] ? "" : "is-soft"}`}
                  onClick={() => setYearOn((cur) => ({ ...cur, [y]: !cur[y] }))}
                >
                  {t("tour.t2mapYear", { year: y })}
                </button>
              ))}
              {tournament?.category && <p className="t2-place-pill is-soft">{tournament.category}</p>}
              {tournament && <p className="t2-place-pill is-soft">{fmtDate(tournament.tournament_monday)}</p>}
            </>
          )}
        </div>

        <div className="pointer-events-auto mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            {world && node ? (
              <SiteCard
                world={world}
                node={node}
                equipment={equipment}
                around={around}
                onPickAround={(h) => {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`, "_blank", "noreferrer");
                }}
              />
            ) : tournament ? (
            <div className="t2-place-card max-w-md">
              <p className="t2-fs-meta font-semibold uppercase tracking-[0.16em] text-white/55">{t("tour.t2placeHere")}</p>
              <h1 className="mt-1 t2-fs-h2 font-bold text-white">{city}</h1>
              <ul className="mt-3 space-y-1.5 t2-fs-body-sm text-white/85">
                {countryLabel && <li>{countryLabel}</li>}
                {surfaceLabel && <li>{surfaceLabel}</li>}
                {deadlineLabel && <li>{deadlineLabel}</li>}
                {tournament?.indoor != null && (
                  <li>{tournament.indoor ? t("tour.ovIndoor") : t("tour.ovOutdoor")}</li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {mapsHref && (
                  <a href={mapsHref} target="_blank" rel="noreferrer" className="t2-place-cta">
                    {t("tour.t2placeGo")}
                  </a>
                )}
                {tournament && (
                  <Link href={tour2PlannerTournamentHref(tournament.id)} className="t2-place-cta is-ghost">
                    {t("tour.t2placeOpen")}
                  </Link>
                )}
                {!tournament && (
                  <Link href={T2_FINDER} className="t2-place-cta">{t("tour.t2homeGoFind")}</Link>
                )}
              </div>
            </div>
            ) : null}

            <div className="flex min-w-0 flex-col gap-2 md:max-w-sm">
              {[...here, ...rest].map((a, i) => {
                const href = a.target.type === "tournament" ? tour2PlannerTournamentHref(a.target.id) : tour2ActionHref(a.target.href);
                return (
                  <Link key={`${a.kind}-${i}`} href={href} className="t2-place-task">
                    <span className={`t2-place-dot ${a.severity === "red" ? "is-red" : "is-amber"}`} />
                    <span className="min-w-0 truncate">{actionText(t, a, countryName, fmtDate, money)}</span>
                  </Link>
                );
              })}
              {actions.length === 0 && <p className="t2-place-pill is-soft">{t("tour.boardClear")}</p>}
            </div>
          </div>

          {children}

          {stops.length > 1 && (
            <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={t("tour.t2navPlanner")}>
              {stops.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onFocus(s.id)}
                  className={`t2-place-hole ${s.id === tournament?.id ? "is-on" : ""}`}
                >
                  {s.city}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 z-20 hidden gap-2 md:flex">
        <Link href={T2_FINDER} className="t2-place-pill is-soft">{t("tour.t2homeGoFind")}</Link>
        <Link href={T2_SEASON} className="t2-place-pill is-soft">{t("tour.t2homeGoSeason")}</Link>
      </div>
    </div>
  );
}
