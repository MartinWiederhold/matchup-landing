"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadProvidersNear, type ServiceProvider } from "@/lib/services";
import ServiceProviderCard from "../shared/ServiceProviderCard";

/** Onboarding-Discovery: zeigt Anbieter in/nahe der eingegebenen Stadt. */
export default function ServicesNearStep({ city }: { city: string }) {
  const t = useT();
  const [rows, setRows] = useState<ServiceProvider[] | null>(null);

  useEffect(() => {
    let alive = true;
    loadProvidersNear(city).then((res) => { if (alive) setRows(res.rows); });
    return () => { alive = false; };
  }, [city]);

  if (rows === null) return <p className="pt-6 text-center text-sm text-neutral-400">…</p>;
  if (rows.length === 0) return <p className="pt-6 text-center text-sm text-neutral-400">{t("services.empty")}</p>;

  return (
    <div className="space-y-2.5">
      {rows.slice(0, 12).map((p) => <ServiceProviderCard key={p.id} p={p} />)}
    </div>
  );
}
