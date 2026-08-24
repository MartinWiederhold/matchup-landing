"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import {
  loadPlayerMaster,
  savePlayerDocs,
  saveEquipment,
  saveEmergency,
  type PlayerDocs,
  type PlayerEquipment,
  type EmergencyContact,
} from "@/lib/tourPlayerMaster";

const inpL = "w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";
const inpD = "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none [color-scheme:dark]";
const lblL = "mb-1 block text-[12px] font-semibold text-neutral-600";
const lblD = "mb-1 block text-[12px] font-semibold text-neutral-400";
const cardL = "rounded-2xl ring-1 ring-black/[0.06] p-4";
const cardD = "border border-white/10 bg-black p-4";
const btn = "mt-3 rounded-full bg-matchup px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50";

const emptyDocs: PlayerDocs = {
  passport_country: null, passport_expiry: null, passport2_country: null, passport2_expiry: null,
  insurance_provider: null, insurance_policy_no: null, insurance_expiry: null, insurance_international: null,
  ipin_id: null, atp_id: null,
};
const emptyEquip: PlayerEquipment = { racket: null, string_model: null, tension_main: null, tension_cross: null, grip_size: null };
const emptyEmerg: EmergencyContact = { contact_name: null, relationship: null, phone: null };

/** Leerer String → null (damit „nicht gesetzt" sauber bleibt). */
const nn = (s: string): string | null => (s.trim() === "" ? null : s.trim());
const numOrNull = (s: string): number | null => { const n = Number(s.replace(",", ".")); return s.trim() === "" || Number.isNaN(n) ? null : n; };
const str = (v: string | number | null): string => (v == null ? "" : String(v));

/**
 * Spielerstammdaten-Formular auf /tour/setup: nur die Felder, aus denen die App etwas macht
 * (Ablaufwarnungen, Visa, Besaiter-Info). Drei Töpfe nach Empfindlichkeit — Dokumente auf
 * tour_profiles (owner-only), Ausrüstung + Notfallkontakt in eigenen Tabellen. KEINE
 * Passnummer/Bankdaten/Steuerkennung/medizinischen Angaben.
 */
export default function PlayerMasterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [docs, setDocs] = useState<PlayerDocs>(emptyDocs);
  const [equip, setEquip] = useState<PlayerEquipment>(emptyEquip);
  const [emerg, setEmerg] = useState<EmergencyContact>(emptyEmerg);
  const [savingDocs, setSavingDocs] = useState(false);
  const [savingEquip, setSavingEquip] = useState(false);
  const [savingEmerg, setSavingEmerg] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const m = await loadPlayerMaster(user.id);
    setDocs(m.docs ?? emptyDocs);
    setEquip(m.equipment ?? emptyEquip);
    setEmerg(m.emergency ?? emptyEmerg);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    reload().then(() => { if (alive) setStatus("ready"); }).catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user, reload]);

  const submitDocs = async () => { if (!user) return; setSavingDocs(true); try { await savePlayerDocs(user.id, docs); await reload(); } finally { setSavingDocs(false); } };
  const submitEquip = async () => { if (!user) return; setSavingEquip(true); try { await saveEquipment(user.id, equip); await reload(); } finally { setSavingEquip(false); } };
  const submitEmerg = async () => { if (!user) return; setSavingEmerg(true); try { await saveEmergency(user.id, emerg); await reload(); } finally { setSavingEmerg(false); } };

  const dark = tone === "dark";
  const inp = dark ? inpD : inpL;
  const lbl = dark ? lblD : lblL;
  const card = dark ? cardD : cardL;
  const muted = dark ? "text-neutral-400" : "text-neutral-500";
  const title = dark ? "text-white" : "text-neutral-900";
  const checkLbl = dark ? "text-neutral-200" : "text-neutral-700";

  if (authLoading) return <p className={`mt-6 text-sm ${muted}`}>{t("tour.loading")}</p>;
  if (!user) {
    return (
      <div className={`mt-6 rounded-2xl p-6 text-center ${dark ? "bg-white/[0.03] ring-1 ring-white/10" : "bg-black/[0.02]"}`}>
        <p className={`text-sm ${muted}`}>{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-3 inline-flex rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white hover:bg-matchup-hover">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className={`mt-6 text-sm ${muted}`}>{t("tour.loading")}</p>;
  if (status === "error") return <p className={`mt-6 text-sm ${muted}`}>{t("tour.loadError")}</p>;

  return (
    <section className={dark ? "mt-2" : "mt-12"}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.pmTitle")}</h2>
      <p className={`mt-2 max-w-2xl text-[13px] leading-relaxed ${muted}`}>{t("tour.pmIntro")}</p>

      <div className="mt-4 grid gap-4">
        {/* ── Dokumente & Ablauf (owner-only) ─────────────────────────────── */}
        <div className={card}>
          <h3 className={`text-[13px] font-bold ${title}`}>{t("tour.pmDocsTitle")}</h3>
          <p className={`mt-1 text-[12px] ${muted}`}>{t("tour.pmDocsHint")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block"><span className={lbl}>{t("tour.pmPassportCountry")}</span><input value={str(docs.passport_country)} onChange={(e) => setDocs({ ...docs, passport_country: nn(e.target.value.toUpperCase().slice(0, 2)) })} placeholder="DE" className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmPassportExpiry")}</span><input type="date" value={str(docs.passport_expiry)} onChange={(e) => setDocs({ ...docs, passport_expiry: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmPassport2Country")}</span><input value={str(docs.passport2_country)} onChange={(e) => setDocs({ ...docs, passport2_country: nn(e.target.value.toUpperCase().slice(0, 2)) })} placeholder="IT" className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmPassport2Expiry")}</span><input type="date" value={str(docs.passport2_expiry)} onChange={(e) => setDocs({ ...docs, passport2_expiry: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmInsuranceProvider")}</span><input value={str(docs.insurance_provider)} onChange={(e) => setDocs({ ...docs, insurance_provider: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmInsurancePolicy")}</span><input value={str(docs.insurance_policy_no)} onChange={(e) => setDocs({ ...docs, insurance_policy_no: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmInsuranceExpiry")}</span><input type="date" value={str(docs.insurance_expiry)} onChange={(e) => setDocs({ ...docs, insurance_expiry: nn(e.target.value) })} className={inp} /></label>
            <label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={docs.insurance_international === true} onChange={(e) => setDocs({ ...docs, insurance_international: e.target.checked })} className="h-4 w-4" /><span className={`text-[13px] ${checkLbl}`}>{t("tour.pmInsuranceInternational")}</span></label>
            <label className="block"><span className={lbl}>{t("tour.pmIpinId")}</span><input value={str(docs.ipin_id)} onChange={(e) => setDocs({ ...docs, ipin_id: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmAtpId")}</span><input value={str(docs.atp_id)} onChange={(e) => setDocs({ ...docs, atp_id: nn(e.target.value) })} className={inp} /></label>
          </div>
          <button type="button" onClick={submitDocs} disabled={savingDocs} className={btn}>{t("tour.pmSave")}</button>
        </div>

        {/* ── Ausrüstung (owner-only; künftig Besaiter) ───────────────────── */}
        <div className={card}>
          <h3 className={`text-[13px] font-bold ${title}`}>{t("tour.pmEquipTitle")}</h3>
          <p className={`mt-1 text-[12px] ${muted}`}>{t("tour.pmEquipHint")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block"><span className={lbl}>{t("tour.pmRacket")}</span><input value={str(equip.racket)} onChange={(e) => setEquip({ ...equip, racket: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmString")}</span><input value={str(equip.string_model)} onChange={(e) => setEquip({ ...equip, string_model: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmGrip")}</span><input value={str(equip.grip_size)} onChange={(e) => setEquip({ ...equip, grip_size: nn(e.target.value) })} placeholder="L3" className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmTensionMain")}</span><input value={str(equip.tension_main)} onChange={(e) => setEquip({ ...equip, tension_main: numOrNull(e.target.value) })} inputMode="decimal" placeholder="24.0" className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmTensionCross")}</span><input value={str(equip.tension_cross)} onChange={(e) => setEquip({ ...equip, tension_cross: numOrNull(e.target.value) })} inputMode="decimal" placeholder="23.0" className={inp} /></label>
          </div>
          <button type="button" onClick={submitEquip} disabled={savingEquip} className={btn}>{t("tour.pmSave")}</button>
        </div>

        {/* ── Notfallkontakt (owner-only; künftig Coach) ──────────────────── */}
        <div className={card}>
          <h3 className={`text-[13px] font-bold ${title}`}>{t("tour.pmEmergTitle")}</h3>
          <p className={`mt-1 text-[12px] ${muted}`}>{t("tour.pmEmergHint")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="block"><span className={lbl}>{t("tour.pmEmergName")}</span><input value={str(emerg.contact_name)} onChange={(e) => setEmerg({ ...emerg, contact_name: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmEmergRelationship")}</span><input value={str(emerg.relationship)} onChange={(e) => setEmerg({ ...emerg, relationship: nn(e.target.value) })} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.pmEmergPhone")}</span><input value={str(emerg.phone)} onChange={(e) => setEmerg({ ...emerg, phone: nn(e.target.value) })} inputMode="tel" className={inp} /></label>
          </div>
          <button type="button" onClick={submitEmerg} disabled={savingEmerg} className={btn}>{t("tour.pmSave")}</button>
        </div>
      </div>
    </section>
  );
}
