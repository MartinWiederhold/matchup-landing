"use client";

import { AXES, type Axis, type Racket } from "@/domain/equipment/racket";

/**
 * Vergleich (Beratungsplattform, Phase 5) — bis zu 3 Rahmen nebeneinander.
 * Zeigt Kern-Specs und die 7 Charakter-Achsen als Balken; pro Achse wird der
 * beste Wert markiert, damit Zielkonflikte (Power vs. Kontrolle …) sichtbar
 * werden. Rein darstellend, keine eigene Logik.
 */
export default function RacketComparison({
  rackets, axisLabel, t,
}: {
  rackets: Racket[];
  axisLabel: (a: Axis) => string;
  t: (k: string) => string;
}) {
  const cols = rackets.slice(0, 3);
  const specRows: { label: string; val: (r: Racket) => string }[] = [
    { label: t("beratung.spec_headSize"), val: (r) => `${r.specs.headSizeSqIn} in²` },
    { label: t("beratung.spec_weight"), val: (r) => `${r.specs.unstrungWeightG} g` },
    { label: t("beratung.spec_stiffness"), val: (r) => `${r.specs.stiffnessRa}` },
    { label: t("beratung.spec_pattern"), val: (r) => r.specs.stringPattern },
  ];

  return (
    <div className="mt-3 overflow-hidden rounded-[24px] bg-black/[0.035] p-4">
      {/* Kopf: Rahmennamen */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `1.2fr repeat(${cols.length}, 1fr)` }}>
        <span />
        {cols.map((r) => (
          <div key={r.id} className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{r.brand}</p>
            <p className="truncate text-[12px] font-extrabold leading-tight text-neutral-900">{r.model}</p>
          </div>
        ))}
      </div>

      {/* Specs */}
      <div className="mt-3 space-y-1.5">
        {specRows.map((row) => (
          <div key={row.label} className="grid items-center gap-2 border-t border-black/[0.06] pt-1.5" style={{ gridTemplateColumns: `1.2fr repeat(${cols.length}, 1fr)` }}>
            <span className="text-[11px] font-semibold text-neutral-500">{row.label}</span>
            {cols.map((r) => (
              <span key={r.id} className="text-center text-[12px] font-bold text-neutral-900">{row.val(r)}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Achsen als Balken */}
      <div className="mt-4 space-y-2.5">
        {AXES.map((a) => {
          const max = Math.max(...cols.map((r) => r.ratings[a]));
          return (
            <div key={a} className="grid items-center gap-2" style={{ gridTemplateColumns: `1.2fr repeat(${cols.length}, 1fr)` }}>
              <span className="text-[11px] font-semibold text-neutral-500">{axisLabel(a)}</span>
              {cols.map((r) => {
                const v = r.ratings[a];
                const best = v === max;
                return (
                  <div key={r.id} className="flex flex-col items-center gap-0.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                      <div className={`h-full rounded-full ${best ? "bg-matchup" : "bg-neutral-400"}`} style={{ width: `${v}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold ${best ? "text-matchup" : "text-neutral-400"}`}>{v}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
