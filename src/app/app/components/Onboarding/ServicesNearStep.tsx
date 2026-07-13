"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadProvidersNear, type ServiceProvider } from "@/lib/services";
import ServiceProviderCard from "../shared/ServiceProviderCard";

/** Onboarding-Discovery: zeigt Anbieter in/nahe der eingegebenen Stadt. */
export default function ServicesNearStep({ city }: { city: string }) {
  const t = useT();
  const [rows, setRows] = useState<ServiceProvider[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setExpanded(false);
    loadProvidersNear(city).then((res) => { if (alive) setRows(res.rows); });
    return () => { alive = false; };
  }, [city]);

  if (rows === null) return <p className="pt-6 text-center text-sm text-neutral-400">…</p>;
  if (rows.length === 0) return <p className="pt-6 text-center text-sm text-neutral-400">{t("services.empty")}</p>;

  const shown = expanded ? rows : rows.slice(0, 4);
  return (
    <div className="space-y-2.5">
      {shown.map((p) => <ServiceProviderCard key={p.id} p={p} />)}
      {!expanded && rows.length > 4 && (
        <button type="button" onClick={() => setExpanded(true)} className="w-full rounded-full bg-black/[0.05] py-3 text-[13px] font-bold text-matchup">
          {t("services.showMore", { n: rows.length - 4 })}
        </button>
      )}
    </div>
  );
}
