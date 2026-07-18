"use client";

import { useState } from "react";
import BeratungWizard from "./BeratungWizard";
import BespannungConfigurator from "./BespannungConfigurator";
import RacketFinder from "@/components/beratung/RacketFinder";
import { useT } from "@/lib/i18n";

type Tab = "finder" | "allgemein" | "bespannung";

export default function BeratungTabs() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("finder");

  const items: { key: Tab; label: string }[] = [
    { key: "finder", label: t("beratung.tabFinder") },
    { key: "allgemein", label: t("beratung.tabGeneral") },
    { key: "bespannung", label: t("beratung.tabStringing") },
  ];

  return (
    <div>
      {/* Toggle (drei Tabs) */}
      <div className="mx-auto mb-8 flex w-fit flex-wrap justify-center gap-1 rounded-full bg-neutral-100 p-1">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => setTab(it.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === it.key ? "bg-black text-white" : "text-neutral-600 hover:text-black"
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>

      {tab === "finder" && <RacketFinder />}
      {tab === "allgemein" && <BeratungWizard />}
      {tab === "bespannung" && <BespannungConfigurator />}
    </div>
  );
}
