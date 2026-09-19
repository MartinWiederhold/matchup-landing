"use client";

/**
 * Glas-Karte für einen Welt-Knoten. Nur belegte Angaben: Quelle, Ausrüstung,
 * echte Around-Treffer. Keine Gehminuten.
 */

import { useT } from "@/lib/i18n";
import type { SiteNode, SiteWorld } from "@/domain/tour/siteWorld";
import type { PlayerEquipment } from "@/lib/tourPlayerMaster";
import type { AroundHit } from "./loadAround";

export default function SiteCard({
  world,
  node,
  equipment,
  around,
  onPickAround,
}: {
  world: SiteWorld;
  node: SiteNode;
  equipment: PlayerEquipment | null;
  around: AroundHit[];
  onPickAround?: (hit: AroundHit) => void;
}) {
  const t = useT();
  const maps = node.lat != null && node.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${node.lat},${node.lng}`
    : null;
  const kindKey = `tour.t2worldKind_${node.kind}`;
  const kindLabel = t(kindKey).startsWith("tour.t2worldKind_") ? node.kind : t(kindKey);

  return (
    <div className="t2-place-card max-w-md">
      <p className="t2-fs-meta font-semibold uppercase tracking-[0.16em] text-white/55">{t("tour.t2worldTitle", { title: world.title, year: world.year })}</p>
      <h1 className="mt-1 t2-fs-h2 font-bold text-white">{node.name}</h1>
      <p className="mt-1 t2-fs-body-sm text-white/70">{kindLabel}</p>

      {node.kind === "stringer" && (
        <div className="mt-3 space-y-1 t2-fs-body-sm text-white/85">
          <p className="font-semibold">{t("tour.t2worldStringer")}</p>
          {equipment?.racket || equipment?.string_model || equipment?.tension_main != null ? (
            <p>
              {[equipment.racket, equipment.string_model, equipment.tension_main != null
                ? `${equipment.tension_main}${equipment.tension_cross != null ? ` / ${equipment.tension_cross}` : ""}`
                : null].filter(Boolean).join(" · ")}
            </p>
          ) : (
            <p>{t("tour.t2worldStringerNeed")}</p>
          )}
        </div>
      )}

      <p className="mt-3 t2-fs-micro text-white/45">{t("tour.t2worldSource")}: {node.source}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer" className="t2-place-cta">
            {t("tour.t2worldGoAround")}
          </a>
        )}
        {!maps && <p className="t2-place-pill is-soft">{t("tour.t2worldGoOnSite")}</p>}
        {node.sourceUrl && (
          <a href={node.sourceUrl} target="_blank" rel="noreferrer" className="t2-place-cta is-ghost">
            {t("tour.t2worldOpenSource")}
          </a>
        )}
      </div>

      <div className="mt-4">
        <p className="t2-fs-meta font-semibold uppercase tracking-[0.16em] text-white/55">{t("tour.t2worldAround")}</p>
        {around.length === 0 ? (
          <p className="mt-1 t2-fs-body-sm text-white/70">{t("tour.t2worldNoAround")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {around.slice(0, 5).map((h) => (
              <li key={`${h.kind}-${h.name}-${h.lat}`}>
                <button type="button" className="t2-world-around" onClick={() => onPickAround?.(h)}>
                  <span className="truncate">{h.name}</span>
                  <span className="shrink-0 text-white/55">{h.dist} m · {t(`tour.t2worldAround_${h.kind}`)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
