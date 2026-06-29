"use client";

import { useState } from "react";
import BeratungWizard from "./BeratungWizard";
import BespannungConfigurator from "./BespannungConfigurator";
import { useT } from "@/lib/i18n";

export default function BeratungTabs() {
  const t = useT();
  const [tab, setTab] = useState<"allgemein" | "bespannung">("allgemein");

  return (
    <div>
      {/* Toggle */}
      <div className="mx-auto mb-8 flex w-fit rounded-full bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setTab("allgemein")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
            tab === "allgemein"
              ? "bg-black text-white"
              : "text-neutral-600 hover:text-black"
          }`}
        >
          {t("beratung.tabGeneral")}
        </button>
        <button
          type="button"
          onClick={() => setTab("bespannung")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
            tab === "bespannung"
              ? "bg-black text-white"
              : "text-neutral-600 hover:text-black"
          }`}
        >
          {t("beratung.tabStringing")}
        </button>
      </div>

      {tab === "allgemein" ? <BeratungWizard /> : <BespannungConfigurator />}
    </div>
  );
}
