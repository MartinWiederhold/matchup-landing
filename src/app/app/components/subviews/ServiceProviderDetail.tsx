"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { loadProvider, loadReviews, submitReview, deleteReview, loadFavoriteIds, toggleFavorite, loadRequestedIds, createRequest, type ServiceProvider, type ProviderReview } from "@/lib/services";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const UNIT: Record<string, string> = { hour: "services.perHour", session: "services.perSession", stringing: "services.perStringing", week: "services.perWeek", year: "services.perYear" };
function Stars({ n, size = 14, onPick }: { n: number; size?: number; onPick?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onPick} onClick={() => onPick?.(i)} className={onPick ? "cursor-pointer" : "cursor-default"} aria-label={`${i}`}>
          <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill={i <= n ? "#f5a623" : "none"} stroke="#f5a623" strokeWidth="1.6"><path d="M12 2l3 6.5 7 .9-5 4.9 1.2 7L12 18.5 5.6 21.3 6.8 14.3 1.8 9.4l7-.9z" /></svg>
        </button>
      ))}
    </span>
  );
}

export default function ServiceProviderDetail({ providerId }: { providerId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAppNav();
  const [p, setP] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [fav, setFav] = useState(false);
  const [requested, setRequested] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function reload() {
    const rv = await loadReviews(providerId);
    setReviews(rv);
    const mine = rv.find((r) => r.user_id === profile.id);
    if (mine) { setMyRating(mine.rating); setMyText(mine.text ?? ""); }
  }
  useEffect(() => {
    (async () => {
      setP(await loadProvider(providerId));
      await reload();
      setFav((await loadFavoriteIds(profile.id)).has(providerId));
      setRequested((await loadRequestedIds(profile.id)).has(providerId));
      setLoaded(true);
    })();
  }, [providerId, profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (myRating < 1) return;
    await submitReview(providerId, profile.id, myRating, myText);
    await reload();
  }
  async function removeMine() {
    await deleteReview(providerId, profile.id);
    setMyRating(0); setMyText("");
    await reload();
  }
  async function toggleFav() {
    const on = !fav; setFav(on);
    await toggleFavorite(profile.id, providerId, on);
  }

  if (!loaded) return <div className="flex h-full items-center justify-center bg-white text-neutral-400">…</div>;
  if (!p) return <div className="flex h-full flex-col bg-white"><SubViewHeader light title="—" /><p className="p-8 text-center text-sm text-neutral-400">{t("services.empty")}</p></div>;

  const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : p.rating;
  const count = reviews.length || p.reviews_count;
  const mineExists = reviews.some((r) => r.user_id === profile.id);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader
        light
        title={p.name}
        rightActions={
          <button type="button" onClick={toggleFav} aria-label="Favorit">
            <svg viewBox="0 0 24 24" className={`h-5 w-5 ${fav ? "text-red-500" : "text-neutral-300"}`} fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {/* Hero */}
        <div className="flex gap-3.5">
          {p.image_url ? <img src={p.image_url} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} className="h-20 w-20 shrink-0 rounded-2xl bg-neutral-100 object-contain" /> : <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-matchup/10 text-2xl font-bold text-matchup">{p.name[0]}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-[18px] font-extrabold tracking-tight">{p.name}</h2>
              {p.verified === "tour_certified" && <span className="shrink-0 rounded-full bg-matchup/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-matchup">{t("services.tourCertified")}</span>}
            </div>
            <p className="text-[12px] text-neutral-500">{p.level}{p.city ? ` · ${p.city}` : ""}</p>
            {avg != null && <p className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-500"><Stars n={Math.round(avg)} /> {avg} {count ? `(${count})` : ""}</p>}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {p.travels && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">{t("services.travels")}</span>}
              {p.sponsor && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-semibold text-neutral-500">{t("services.sponsoredBy", { brand: p.sponsor })}</span>}
            </div>
          </div>
        </div>

        {p.bio && <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-600">{p.bio}</p>}
        {p.languages?.length > 0 && <p className="mt-2 text-[12px] text-neutral-400">{t("services.speaks")}: {p.languages.join(", ").toUpperCase()}</p>}

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/[0.035] p-4">
          <span className="text-[15px] font-extrabold">
            {p.price_from != null && <><span className="text-neutral-400 text-[12px] font-medium">{t("services.from")} </span>{p.price_from} {p.currency}<span className="text-[11px] font-medium text-neutral-400"> {p.price_unit ? t(UNIT[p.price_unit] ?? "services.perHour") : ""}</span></>}
          </span>
          {p.contact_email || p.website ? (
            <span className="flex items-center gap-1.5">
              {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="rounded-full bg-black/[0.06] px-4 py-2 text-[13px] font-bold text-neutral-700">{t("services.website")}</a>}
              {p.contact_email && <a href={`mailto:${p.contact_email}?subject=${encodeURIComponent(t("services.mailSubject"))}`} className="rounded-full bg-matchup px-5 py-2 text-[13px] font-bold text-white">{t("services.email")}</a>}
            </span>
          ) : (
            <button type="button" onClick={() => { setRequested(true); void createRequest(profile.id, providerId); }} disabled={requested} className={`rounded-full px-5 py-2 text-[13px] font-bold ${requested ? "bg-emerald-500/10 text-emerald-600" : "bg-matchup text-white"}`}>{requested ? t("services.requested") : t("services.request")}</button>
          )}
        </div>
        {requested && !p.contact_email && !p.website && <p className="mt-1.5 px-1 text-[11px] text-neutral-400">{t("services.requestSent")}</p>}

        {/* Reviews */}
        <p className="mb-2 mt-6 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("services.reviewsTitle")}</p>

        {/* Eigene Bewertung schreiben/bearbeiten */}
        <div className="rounded-2xl border border-black/[0.07] p-3.5">
          <p className="mb-2 text-[12px] font-semibold text-neutral-600">{t("services.yourRating")}</p>
          <Stars n={myRating} size={24} onPick={setMyRating} />
          <textarea value={myText} onChange={(e) => setMyText(e.target.value)} rows={2} maxLength={400} placeholder={t("services.reviewPlaceholder")} className="mt-2 w-full rounded-xl bg-black/[0.04] px-3 py-2.5 text-sm outline-none" />
          <div className="mt-2 flex gap-2">
            {mineExists && <button type="button" onClick={removeMine} className="rounded-full bg-black/[0.05] px-4 py-2 text-[12px] font-bold text-red-500">{t("services.deleteReview")}</button>}
            <button type="button" onClick={save} disabled={myRating < 1} className="flex-1 rounded-full bg-matchup py-2 text-[12px] font-bold text-white disabled:opacity-40">{mineExists ? t("services.updateReview") : t("services.submitReview")}</button>
          </div>
        </div>

        {/* Liste */}
        <div className="mt-3 space-y-2.5">
          {reviews.length === 0 ? (
            <p className="pt-2 text-center text-[13px] text-neutral-400">{t("services.noReviews")}</p>
          ) : reviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-black/[0.035] p-3">
              <div className="flex items-center gap-2.5">
                {r.author?.profile_image ? <img src={r.author.profile_image} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-500">{(r.author?.first_name?.[0] ?? "?").toUpperCase()}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-neutral-900">{r.author?.first_name ?? "—"}</span>
                  <span className="flex items-center gap-1.5"><Stars n={r.rating} size={11} /> <span className="text-[10.5px] text-neutral-400">{fmtDate(r.created_at)}</span></span>
                </span>
              </div>
              {r.text && <p className="mt-2 text-[13px] leading-snug text-neutral-600">{r.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
