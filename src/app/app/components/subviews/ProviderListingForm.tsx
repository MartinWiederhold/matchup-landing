"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useT } from "@/lib/i18n";
import { createProviderListing, loadMyListings, deleteListing, uploadProviderImage, deleteProviderImage, type ServiceCategory, type ServiceProvider } from "@/lib/services";
import { sportLabel } from "@/lib/utils/formatters";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const CATS: ServiceCategory[] = ["coach", "hitting", "stringer", "physio"];
const SPORTS = ["tennis", "padel", "pickleball"];
const LEVELS = ["Anfänger", "Fortgeschrittene", "Turnierspieler", "Alle Level"];
const UNITS = ["hour", "session", "stringing", "week", "year"];

export default function ProviderListingForm() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [mine, setMine] = useState<ServiceProvider[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("coach");
  const [sport, setSport] = useState("tennis");
  const [city, setCity] = useState(profile.city ?? "");
  const [level, setLevel] = useState("Alle Level");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("hour");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => { loadMyListings(profile.id).then(setMine); }, [profile.id]);

  // Bildfeld: eigenes Foto in provider-images/<uid>/… hochladen → öffentliche URL in image_url.
  async function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImgBusy(true);
    setError(false);
    const url = await uploadProviderImage(profile.id, file);
    setImgBusy(false);
    if (url) setImageUrl(url); else setError(true);
  }
  async function onRemoveImage() {
    const url = imageUrl;
    setImageUrl(null);
    if (url) await deleteProviderImage(url);
  }

  const valid = name.trim().length >= 2 && city.trim().length >= 2 && (email.trim() !== "" || website.trim() !== "");

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(false);
    const res = await createProviderListing(profile.id, {
      name, category, sport, city, level, bio, website, contact_email: email,
      price_from: price.trim() ? Number(price) : null, price_unit: unit, currency: "CHF",
      image_url: imageUrl,
    });
    setSaving(false);
    if (res) openSubView({ type: "service-detail", providerId: res.id });
    else setError(true);
  }

  async function remove(id: string) {
    setMine((m) => m.filter((x) => x.id !== id));
    await deleteListing(profile.id, id);
  }

  const label = "mb-1.5 mt-4 block px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400";
  const input = "w-full rounded-xl bg-black/[0.04] px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400";
  const chip = (active: boolean) => `shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${active ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-500"}`;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("services.listTitle")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <p className="rounded-2xl bg-matchup/[0.06] p-3 text-[12.5px] leading-snug text-neutral-600">{t("services.listIntro")}</p>

        {mine.length > 0 && (
          <div className="mt-4">
            <p className={label}>{t("services.myListings")}</p>
            <div className="space-y-2">
              {mine.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-black/[0.07] px-3 py-2.5">
                  <button type="button" onClick={() => openSubView({ type: "service-detail", providerId: m.id })} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13px] font-bold">{m.name}</span>
                    <span className="block truncate text-[11px] text-neutral-500">{t(`services.cat_${m.category}`)}{m.city ? ` · ${m.city}` : ""}</span>
                  </button>
                  <button type="button" onClick={() => remove(m.id)} className="shrink-0 text-[11px] font-bold text-red-500">{t("services.deleteListing")}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className={label}>{t("services.fPhoto")}</label>
        {imageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <button type="button" onClick={onRemoveImage} className="text-[12px] font-bold text-red-500">{t("services.fPhotoRemove")}</button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-3.5 py-3 text-[13px] font-semibold text-neutral-500 hover:bg-black/[0.04]">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={onPickImage} disabled={imgBusy} className="hidden" />
            {imgBusy ? "…" : t("services.fPhotoAdd")}
          </label>
        )}
        <p className="mt-1.5 px-1 text-[11px] text-neutral-400">{t("services.fPhotoHint")}</p>

        <label className={label}>{t("services.fName")}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("services.fNamePh")} className={input} />

        <label className={label}>{t("services.fCategory")}</label>
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => <button key={c} type="button" onClick={() => setCategory(c)} className={chip(category === c)}>{t(`services.cat_${c}`)}</button>)}
        </div>

        <label className={label}>{t("services.fSport")}</label>
        <div className="flex gap-2">
          {SPORTS.map((s) => <button key={s} type="button" onClick={() => setSport(s)} className={chip(sport === s)}>{sportLabel(s)}</button>)}
        </div>

        <label className={label}>{t("services.fLevel")}</label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => <button key={l} type="button" onClick={() => setLevel(l)} className={chip(level === l)}>{l}</button>)}
        </div>

        <label className={label}>{t("services.fCity")}</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Zürich" className={input} />

        <label className={label}>{t("services.fPrice")}</label>
        <div className="flex gap-2">
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="CHF" className={`${input} w-28`} />
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={`${input} flex-1`}>
            {UNITS.map((u) => <option key={u} value={u}>{t(`services.per${u.charAt(0).toUpperCase() + u.slice(1)}`)}</option>)}
          </select>
        </div>

        <label className={label}>{t("services.fWebsite")}</label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" placeholder="https://…" className={input} />

        <label className={label}>{t("services.fEmail")}</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="kontakt@…" className={input} />

        <label className={label}>{t("services.fBio")}</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={400} placeholder={t("services.fBioPh")} className={input} />

        <p className="mt-2 px-1 text-[11px] text-neutral-400">{t("services.listContactHint")}</p>

        {error && <p className="mt-3 rounded-xl bg-red-500/[0.08] px-3 py-2 text-center text-[12px] font-semibold text-red-600">{t("services.listError")}</p>}
        <button type="button" onClick={submit} disabled={!valid || saving} className="mt-4 w-full rounded-full bg-matchup py-3 text-[14px] font-bold text-white disabled:opacity-40">
          {saving ? "…" : t("services.listSubmit")}
        </button>
      </div>
    </div>
  );
}
