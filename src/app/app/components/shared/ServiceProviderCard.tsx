"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { ServiceProvider } from "@/lib/services";

const UNIT_KEY: Record<string, string> = {
  hour: "services.perHour", session: "services.perSession", stringing: "services.perStringing",
  week: "services.perWeek", year: "services.perYear",
};

export default function ServiceProviderCard({ p }: { p: ServiceProvider }) {
  const t = useT();
  const [requested, setRequested] = useState(false);

  return (
    <div className="rounded-2xl border border-black/[0.07] p-3">
      <div className="flex gap-3">
        {p.image_url ? (
          <img src={p.image_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-lg font-bold text-neutral-500">{p.name[0]}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-bold text-neutral-900">{p.name}</span>
            {p.verified === "tour_certified" && (
              <span className="shrink-0 rounded-full bg-matchup/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-matchup">{t("services.tourCertified")}</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-neutral-500">
            {p.level}{p.rating != null ? ` · ★ ${p.rating}` : ""}{p.reviews_count ? ` (${p.reviews_count})` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {p.travels && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">{t("services.travels")}</span>}
            {p.sponsor && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold text-neutral-500">{t("services.sponsoredBy", { brand: p.sponsor })}</span>}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2.5">
        <span className="text-[13px] font-bold text-neutral-900">
          {p.price_from != null && (
            <>
              <span className="text-neutral-400">{t("services.from")} </span>
              {p.price_from} {p.currency}
              <span className="text-[11px] font-medium text-neutral-400"> {p.price_unit ? t(UNIT_KEY[p.price_unit] ?? "services.perHour") : ""}</span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => setRequested(true)}
          disabled={requested}
          className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold ${requested ? "bg-emerald-500/10 text-emerald-600" : "bg-matchup text-white"}`}
        >
          {requested ? t("services.requested") : t("services.request")}
        </button>
      </div>
      {requested && <p className="mt-1.5 text-[11px] text-neutral-400">{t("services.requestSent")}</p>}
    </div>
  );
}
