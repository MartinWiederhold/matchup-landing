"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { CARD_SOFT } from "../tourUi";
import ExpensesTourView from "../../expenses/components/ExpensesTourView";
import SchengenView from "../../schengen/components/SchengenView";
import CalendarView from "../../calendar/components/CalendarView";

type PanelKey = "expenses" | "schengen" | "events";

/**
 * „Selteneres" ganz unten: Ausgaben erfassen, Schengen, Termine — eingeklappt, damit sie
 * die tägliche Arbeit (Frist, Überblick, Saison) nicht verdrängen. Die bestehenden
 * Einzelansichten werden unverändert wiederverwendet und erst beim Aufklappen geladen
 * (kein Vorab-Load von drei Ansichten).
 */
export default function RareStuff() {
  const t = useT();
  const [open, setOpen] = useState<PanelKey | null>(null);
  const toggle = (k: PanelKey) => setOpen((cur) => (cur === k ? null : k));

  const panels: { key: PanelKey; label: string; body: React.ReactNode }[] = [
    { key: "expenses", label: t("tour.wsRareExpenses"), body: <ExpensesTourView /> },
    { key: "schengen", label: t("tour.wsRareSchengen"), body: <SchengenView /> },
    { key: "events", label: t("tour.wsRareEvents"), body: <CalendarView /> },
  ];

  return (
    <section>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsRareTitle")}</h2>
      <div className="mt-3 space-y-2">
        {panels.map((p) => {
          const isOpen = open === p.key;
          return (
            <div key={p.key} className={CARD_SOFT}>
              <button
                type="button"
                onClick={() => toggle(p.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-semibold text-neutral-600"
              >
                {p.label}
                <span className={`text-neutral-300 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {/* Erst beim Aufklappen mounten → die Ansicht lädt ihre Daten erst dann. */}
              {isOpen && <div className="border-t border-black/[0.06] px-3 pb-3">{p.body}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
