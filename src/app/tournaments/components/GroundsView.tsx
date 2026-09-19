"use client";

/**
 * Besucher-Gelände: Liste oder Karte, Karte randlos.
 * 3D nur nach bewusstem Tippen — Pinch zoomt, öffnet keine Karte.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { isAmenityKind, isOnCampus, nodeById } from "@/domain/tour/siteWorld";
import { authoredWorlds, worldById } from "@/app/tour2/worlds/catalog";
import SiteWorld from "@/app/tour2/components/world/SiteWorld";
import SiteCard from "@/app/tour2/components/world/SiteCard";
import AmenityBar, { type AmenityFilter } from "@/app/tour2/components/world/AmenityBar";
import { useSiteWeather } from "@/app/tour2/components/world/loadWeather";
import { loadAround, type AroundHit } from "@/app/tour2/components/world/loadAround";
import PlaceMap, { type PlacePin } from "@/app/tour2/components/home/PlaceMap";

const YEAR_FILTERS = [2026, 2027] as const;
const WORLD_PIN = "world:";

export default function GroundsView() {
  const t = useT();
  const [view, setView] = useState<"list" | "map">("map");
  const [worldId, setWorldId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [yearOn, setYearOn] = useState<Record<number, boolean>>({ 2026: true, 2027: true });
  const [around, setAround] = useState<AroundHit[]>([]);
  const [filter, setFilter] = useState<AmenityFilter>("all");
  const world = worldId ? worldById(worldId) : null;
  const weather = useSiteWeather(world);
  const node = world && nodeId ? nodeById(world, nodeId) : null;
  const worlds = authoredWorlds().filter((w) => yearOn[w.year]);
  const places = world?.nodes.filter((n) => !isAmenityKind(n.kind)) ?? [];

  const pins: PlacePin[] = worlds.map((w) => ({
    id: `${WORLD_PIN}${w.id}`,
    lat: w.origin.lat,
    lng: w.origin.lng,
    label: t("tour.t2worldTitle", { title: w.title, year: w.year }),
    tone: "world" as const,
  }));

  useEffect(() => {
    if (!world) return;
    let stop = false;
    loadAround(world).then((rows) => { if (!stop) setAround(rows); }).catch(() => { if (!stop) setAround([]); });
    return () => { stop = true; };
  }, [world]);

  const switcher = (
    <div className="t2-view-switch" role="tablist" aria-label={`${t("tournaments.viewList")} / ${t("tournaments.viewMap")}`}>
      <button
        type="button"
        role="tab"
        aria-selected={view === "list"}
        className={view === "list" ? "is-on" : ""}
        onClick={() => setView("list")}
      >
        {t("tournaments.viewList")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "map"}
        className={view === "map" ? "is-on" : ""}
        onClick={() => setView("map")}
      >
        {t("tournaments.viewMap")}
      </button>
    </div>
  );

  return (
    <div className="t2-place relative min-h-0 flex-1 overflow-hidden">
      {view === "map" && (
        world ? (
          <SiteWorld
            world={world}
            focusId={nodeId}
            onFocus={setNodeId}
            onMiss={() => setNodeId(null)}
            weather={weather}
            filter={filter}
          />
        ) : (
          <PlaceMap
            pins={pins}
            selectedId={null}
            onSelect={(id) => {
              if (!id.startsWith(WORLD_PIN)) return;
              setWorldId(id.slice(WORLD_PIN.length));
              setNodeId(null);
            }}
          />
        )
      )}

      {view === "list" && (
        <div className="t2-grounds-list">
          <div className="flex flex-wrap items-center gap-1.5">
            {switcher}
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
          </div>
          {world ? (
            <>
              <button
                type="button"
                className="t2-grounds-row is-back"
                onClick={() => { setWorldId(null); setNodeId(null); }}
              >
                {t("tour.t2worldBackMap")}
              </button>
              <p className="t2-grounds-kicker">{t("tournaments.listPlaces")}</p>
              <p className="t2-grounds-lead">{t("tour.t2worldTitle", { title: world.title, year: world.year })}</p>
              <ul className="t2-grounds-ul">
                {places.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`t2-grounds-row ${nodeId === n.id ? "is-on" : ""}`}
                      onClick={() => { setNodeId(n.id); setView("map"); }}
                    >
                      {n.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="t2-grounds-kicker">{t("tournaments.listWorlds")}</p>
              <ul className="t2-grounds-ul">
                {worlds.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="t2-grounds-row"
                      onClick={() => { setWorldId(w.id); setNodeId(null); setView("map"); }}
                    >
                      {t("tour.t2worldTitle", { title: w.title, year: w.year })}
                    </button>
                  </li>
                ))}
              </ul>
              <nav className="t2-grounds-more" aria-label={t("tournaments.brand")}>
                <Link href="/tournaments/find" className="t2-grounds-row">{t("tournaments.navFind")}</Link>
                <Link href="/tournaments/guide" className="t2-grounds-row">{t("tournaments.navGuide")}</Link>
              </nav>
            </>
          )}
        </div>
      )}

      {view === "map" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col px-1.5 pt-[max(0.4rem,env(safe-area-inset-top))]">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            {switcher}
            {world ? (
              <>
                <button type="button" className="t2-place-pill" onClick={() => { setWorldId(null); setNodeId(null); }}>
                  {t("tour.t2worldBackMap")}
                </button>
                <p className="t2-place-pill is-soft">{t("tour.t2worldTitle", { title: world.title, year: world.year })}</p>
                <AmenityBar filter={filter} onFilter={setFilter} weather={weather} />
              </>
            ) : (
              YEAR_FILTERS.map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={yearOn[y]}
                  className={`t2-place-pill ${yearOn[y] ? "" : "is-soft"}`}
                  onClick={() => setYearOn((cur) => ({ ...cur, [y]: !cur[y] }))}
                >
                  {t("tour.t2mapYear", { year: y })}
                </button>
              ))
            )}
          </div>

          {world && node && (
            <div className="pointer-events-auto mt-auto pb-[max(0.55rem,env(safe-area-inset-bottom))]">
              <SiteCard
                world={world}
                node={node}
                equipment={null}
                around={around.filter((h) => isOnCampus(world, h.lat, h.lng))}
                onPickAround={(h) => {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`, "_blank", "noreferrer");
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
