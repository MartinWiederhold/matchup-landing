"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { ActionBoard, ActionItem } from "@/domain/tour/actionBoard";

/**
 * Morgen-Dashboard: die Fünf-Minuten-Übersicht in der rechten Spalte, wenn kein Turnier
 * gewählt ist. Vier Blöcke (Spieler / Aktuell / Nächste Wochen / Handlungsbedarf). Zeigt NUR,
 * was Handlung erfordert; ist nichts zu tun, sagt es das. Jeder Handlungspunkt führt an die
 * Stelle, wo man ihn erledigt — Turnier im Planer öffnen oder Route aufrufen.
 *
 * Die Aggregation/Ordnung liegt rein in src/domain/tour/actionBoard.ts. Diese Komponente
 * übersetzt nur und verlinkt. FARBE: Rot ausschließlich für bereits Eingetretenes, Bernstein
 * für Bevorstehendes (die Domain vergibt die Severity, hier wird sie nur eingefärbt).
 */
export default function MorningBoard({
  board,
  onOpen,
  countryName,
  fmtDate,
  money,
}: {
  board: ActionBoard;
  onOpen: (id: string) => void;
  countryName: (c: string | null) => string;
  fmtDate: (iso: string) => string;
  money: (minor: number, cur: string) => string;
}) {
  const t = useT();
  const head = "text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400";
  const place = (city: string | null, country: string | null) => `${city || t("tour.fieldMissing")}${country ? ", " + countryName(country) : ""}`;

  // Text eines Handlungspunkts — Dokument-Punkte nutzen die reichen documentWarnings-Texte.
  const actionText = (a: ActionItem): string => {
    const p = a.params;
    if (a.kind === "doc_expired" || a.kind === "doc_expiring") {
      return t(`tour.docWarn_${p.kind}`, { date: p.date ?? "", days: p.days ?? 0, dest: p.dest ? countryName(String(p.dest)) : "" });
    }
    if (a.kind === "budget_over") return t("tour.action_budget_over", { amount: money(Number(p.amount), String(p.currency)) });
    if (a.kind === "entry_banned") return t("tour.action_entry_banned", { city: p.city ?? "", dest: countryName(String(p.dest)) });
    if (a.kind === "points_expiring") return t("tour.action_points_expiring", { points: p.points ?? 0, date: fmtDate(String(p.date)) });
    if (a.kind === "visa_lead") return t("tour.action_visa_lead", { city: p.city ?? "", dest: countryName(String(p.dest)), weeks: p.weeks ?? 0, lead: p.lead ?? 0 });
    return t(`tour.action_${a.kind}`, p);
  };
  const isRuleOfThumb = (a: ActionItem) => (a.kind === "doc_expiring" || a.kind === "doc_expired") && a.params.ruleOfThumb === 1;
  // Vorlaufzeit beruht auf der eigenen Angabe → als Schätzung kennzeichnen (wie die Faustregel).
  const isUserEstimate = (a: ActionItem) => a.kind === "visa_lead";

  return (
    <div className="space-y-5">
      {/* ── SPIELER ─────────────────────────────────────────────────────────── */}
      {board.player && (
        <section>
          <h2 className={head}>{t("tour.boardPlayer")}</h2>
          <Link href="/tour2/points" className="mt-2 block rounded-2xl bg-black/[0.02] p-3 ring-1 ring-black/5 hover:bg-black/[0.04]">
            <p className="text-[22px] font-extrabold tabular-nums text-neutral-900">{board.player.total} <span className="text-[13px] font-semibold text-neutral-400">{t("tour.boardPointsUnit")}</span></p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {board.player.nextExpiry ? t("tour.boardNextExpiry", { points: board.player.nextExpiry.points, date: fmtDate(board.player.nextExpiry.date) }) : t("tour.boardNoExpiry")}
            </p>
          </Link>
        </section>
      )}

      {/* ── AKTUELL ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className={head}>{t("tour.boardCurrent")}</h2>
        {board.current ? (
          <button type="button" onClick={() => onOpen(board.current!.id)} className="mt-2 block w-full rounded-2xl bg-black/[0.02] p-3 text-left ring-1 ring-black/5 hover:bg-black/[0.04]">
            <p className="truncate text-[13px] font-semibold text-neutral-900">{place(board.current.city, board.current.country)}</p>
            <p className="mt-0.5 text-[12px] text-neutral-500">{t(`tour.status_${board.current.status}`)}</p>
          </button>
        ) : (
          <p className="mt-2 text-[12px] text-neutral-400">{t("tour.boardCurrentNone")}</p>
        )}
      </section>

      {/* ── NÄCHSTE WOCHEN ──────────────────────────────────────────────────── */}
      {board.upcoming.length > 0 && (
        <section>
          <h2 className={head}>{t("tour.boardUpcoming")}</h2>
          <ul className="mt-2 space-y-1.5">
            {board.upcoming.map((w) => (
              <li key={w.id}>
                <button type="button" onClick={() => onOpen(w.id)} className="flex w-full items-center justify-between gap-2 rounded-xl bg-black/[0.02] px-3 py-2 text-left ring-1 ring-black/5 hover:bg-black/[0.04]">
                  <span className="min-w-0 truncate text-[13px] font-semibold text-neutral-800">{place(w.city, w.country)}</span>
                  <span className="shrink-0 text-[11px] text-neutral-400">{t(`tour.status_${w.status}`)} · {fmtDate(w.monday)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── HANDLUNGSBEDARF (Ampel) ─────────────────────────────────────────── */}
      <section>
        <h2 className={head}>{t("tour.boardActions")}</h2>
        {board.clear ? (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-500/[0.08] px-3 py-2.5 text-[13px] font-semibold text-emerald-700">
            <span aria-hidden>✓</span> {t("tour.boardClear")}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {board.actions.map((a, i) => {
              const cls = a.severity === "red" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-800 ring-amber-200";
              const dot = a.severity === "red" ? "bg-red-500" : "bg-amber-500";
              const inner = (
                <span className="flex items-start gap-2">
                  <span aria-hidden className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="min-w-0">
                    {actionText(a)}
                    {isRuleOfThumb(a) && <span className="mt-0.5 block text-[11px] font-normal opacity-80">{t("tour.docWarnRuleOfThumb")}</span>}
                    {isUserEstimate(a) && <span className="mt-0.5 block text-[11px] font-normal opacity-80">{t("tour.visaLeadUserEstimate")}</span>}
                  </span>
                </span>
              );
              const klass = `block w-full rounded-xl px-3 py-2 text-left text-[12px] font-semibold leading-snug ring-1 transition-colors ${cls}`;
              return (
                <li key={`${a.kind}-${i}`}>
                  {a.target.type === "tournament" ? (
                    <button type="button" onClick={() => onOpen((a.target as { id: string }).id)} className={`${klass} hover:brightness-95`}>{inner}</button>
                  ) : (
                    <Link href={(a.target as { href: string }).href} className={`${klass} hover:brightness-95`}>{inner}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
