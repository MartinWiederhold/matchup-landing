"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadRequests, cancelRequest, loadFavoriteProviders, type ServiceRequest, type ServiceProvider } from "@/lib/services";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const STATUS: Record<string, { key: string; cls: string }> = {
  open: { key: "services.statusOpen", cls: "bg-amber-500/12 text-amber-600" },
  confirmed: { key: "services.statusConfirmed", cls: "bg-emerald-500/12 text-emerald-600" },
  declined: { key: "services.statusDeclined", cls: "bg-neutral-400/15 text-neutral-500" },
  done: { key: "services.statusDone", cls: "bg-blue-500/12 text-blue-600" },
};

function MiniRow({ p, onOpen, right }: { p: ServiceProvider; onOpen: () => void; right?: React.ReactNode }) {
  const t = useT();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.07] p-2.5">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-base font-bold text-neutral-500">{p.name[0]}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-neutral-900">{p.name}</span>
          <span className="block truncate text-[11.5px] text-neutral-500">{t(`services.one_${p.category}`)}{p.city ? ` · ${p.city}` : ""}{p.price_from != null ? ` · ${t("services.from")} ${p.price_from} ${p.currency}` : ""}</span>
        </span>
      </button>
      {right}
    </div>
  );
}

export default function MyTeam() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [reqs, setReqs] = useState<ServiceRequest[] | null>(null);
  const [favs, setFavs] = useState<ServiceProvider[] | null>(null);

  async function reload() {
    const [r, f] = await Promise.all([loadRequests(profile.id), loadFavoriteProviders(profile.id)]);
    setReqs(r); setFavs(f);
  }
  useEffect(() => { reload(); }, [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancel(providerId: string) {
    setReqs((rs) => rs?.filter((r) => r.provider_id !== providerId) ?? rs);
    await cancelRequest(profile.id, providerId);
  }

  const open = (id: string) => openSubView({ type: "service-detail", providerId: id });
  const label = "mb-2.5 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400";
  const activeReqs = (reqs ?? []).filter((r) => r.provider);

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("services.myTeam")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {reqs === null ? null : (
          <>
            {/* Anfragen */}
            <p className={label}>{t("services.requests")}</p>
            {activeReqs.length === 0 ? (
              <p className="mb-6 rounded-2xl bg-black/[0.035] p-4 text-center text-[13px] text-neutral-400">{t("services.noRequests")}</p>
            ) : (
              <div className="mb-6 space-y-2.5">
                {activeReqs.map((r) => {
                  const s = STATUS[r.status] ?? STATUS.open;
                  return (
                    <MiniRow key={r.id} p={r.provider!} onOpen={() => open(r.provider_id)} right={
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${s.cls}`}>{t(s.key)}</span>
                        <button type="button" onClick={() => cancel(r.provider_id)} className="text-[11px] font-semibold text-neutral-400">{t("services.cancelRequest")}</button>
                      </div>
                    } />
                  );
                })}
              </div>
            )}

            {/* Favoriten */}
            <p className={label}>{t("services.favorites")}</p>
            {(favs ?? []).length === 0 ? (
              <p className="rounded-2xl bg-black/[0.035] p-4 text-center text-[13px] text-neutral-400">{t("services.noFavorites")}</p>
            ) : (
              <div className="space-y-2.5">
                {favs!.map((p) => <MiniRow key={p.id} p={p} onOpen={() => open(p.id)} />)}
              </div>
            )}

            <button type="button" onClick={() => openSubView({ type: "services" })} className="mt-6 w-full rounded-full bg-black/[0.05] py-3 text-[13px] font-bold text-matchup">{t("services.browseAll")}</button>
          </>
        )}
      </div>
    </div>
  );
}
