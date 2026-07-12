"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadProviders, loadFavoriteProviders, loadFavoriteIds, toggleFavorite, type ServiceProvider, type ServiceCategory } from "@/lib/services";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import ServiceProviderCard from "../shared/ServiceProviderCard";

const CATS: (ServiceCategory | "all")[] = ["all", "coach", "hitting", "stringer", "physio"];

export default function ServicesHub() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [view, setView] = useState<"browse" | "favorites">("browse");
  const [cat, setCat] = useState<ServiceCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ServiceProvider[] | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => { loadFavoriteIds(profile.id).then(setFavs); }, [profile.id]);

  useEffect(() => {
    let alive = true;
    setRows(null);
    const p = view === "browse"
      ? loadProviders({ category: cat === "all" ? null : cat, limit: 120 })
      : loadFavoriteProviders(profile.id);
    p.then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [cat, view, profile.id]);

  async function toggle(p: ServiceProvider) {
    const on = !favs.has(p.id);
    setFavs((s) => { const n = new Set(s); if (on) n.add(p.id); else n.delete(p.id); return n; });
    await toggleFavorite(profile.id, p.id, on);
    if (view === "favorites" && !on) setRows((rs) => rs?.filter((x) => x.id !== p.id) ?? rs);
  }

  const shown = useMemo(() => {
    if (!rows) return null;
    const qq = query.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((p) => `${p.name} ${p.city ?? ""} ${p.level ?? ""}`.toLowerCase().includes(qq));
  }, [rows, query]);

  const pill = (active: boolean) => `rounded-full px-4 py-1.5 text-[13px] font-semibold ${active ? "bg-neutral-900 text-white" : "bg-black/[0.05] text-neutral-500"}`;
  const chip = (active: boolean) => `shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${active ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-500"}`;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("services.title")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="mb-3 flex gap-2">
          {(["browse", "favorites"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={pill(view === v)}>{t(v === "browse" ? "services.browse" : "services.favorites")}</button>
          ))}
        </div>

        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("services.searchPlaceholder")} className="mb-3 w-full rounded-full bg-black/[0.05] px-4 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />

        {view === "browse" && (
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {CATS.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className={chip(cat === c)}>{c === "all" ? t("services.all") : t(`services.cat_${c}`)}</button>
            ))}
          </div>
        )}

        {shown === null ? null : shown.length === 0 ? (
          <p className="pt-8 text-center text-[13px] text-neutral-400">{view === "favorites" ? t("services.noFavorites") : t("services.empty")}</p>
        ) : (
          <div className="space-y-2.5">
            {shown.map((p) => <ServiceProviderCard key={p.id} p={p} favorited={favs.has(p.id)} onToggleFav={() => toggle(p)} onOpen={() => openSubView({ type: "service-detail", providerId: p.id })} />)}
          </div>
        )}
      </div>
    </div>
  );
}
