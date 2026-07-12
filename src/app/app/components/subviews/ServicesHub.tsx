"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadProviders, type ServiceProvider, type ServiceCategory } from "@/lib/services";
import { SubViewHeader } from "../shared/ui";
import ServiceProviderCard from "../shared/ServiceProviderCard";

const CATS: (ServiceCategory | "all")[] = ["all", "coach", "hitting", "stringer", "physio"];

export default function ServicesHub() {
  const t = useT();
  const [cat, setCat] = useState<ServiceCategory | "all">("all");
  const [rows, setRows] = useState<ServiceProvider[] | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    loadProviders({ category: cat === "all" ? null : cat }).then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [cat]);

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("services.title")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <p className="mb-3 px-1 text-[12px] text-neutral-500">{t("services.hubSubtitle")}</p>
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${cat === c ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-500"}`}
            >
              {c === "all" ? t("services.all") : t(`services.cat_${c}`)}
            </button>
          ))}
        </div>
        {rows === null ? null : rows.length === 0 ? (
          <p className="pt-8 text-center text-[13px] text-neutral-400">{t("services.empty")}</p>
        ) : (
          <div className="space-y-2.5">
            {rows.map((p) => <ServiceProviderCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
