"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import { loadTourProfile, saveTourProfile, loadTeam, ensureInvite, inviteUrl, removeInvite, type TeamInvite } from "@/lib/tour";
import type { Circuit, TeamMember } from "@/lib/types";

const CIRCUITS: { value: Circuit; label: string }[] = [
  { value: "atp", label: "ATP Tour" },
  { value: "challenger", label: "ATP Challenger" },
  { value: "itf", label: "ITF World Tennis Tour" },
  { value: "wta", label: "WTA Tour" },
];
const ROLES = ["coach", "physio", "agent", "hitting_partner"] as const;
const ROLE_KEY: Record<string, string> = {
  coach: "onboarding.roleCoach", physio: "onboarding.rolePhysio", agent: "onboarding.roleAgent", hitting_partner: "onboarding.roleHitting",
};
const ESTA_OPTS = ["ESTA", "B-1", "P-1", "None"];

const inp = "w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup";

export default function TourProfileEdit() {
  const t = useT();
  const { profile, closeSubView } = useAppNav();
  const [loaded, setLoaded] = useState(false);
  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [ranking, setRanking] = useState("");
  const [points, setPoints] = useState("");
  const [passports, setPassports] = useState<string[]>(["", ""]);
  const [taxResidence, setTaxResidence] = useState("");
  const [estaStatus, setEstaStatus] = useState<string | null>(null);
  const [estaExpiry, setEstaExpiry] = useState("");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function copyInvite(role: string) {
    const token = await ensureInvite(profile.id, role);
    try { await navigator.clipboard.writeText(inviteUrl(token)); } catch { /* ignore */ }
    setCopied(role);
    setInvites(await loadTeam(profile.id));
    setTimeout(() => setCopied((c) => (c === role ? null : c)), 2500);
  }

  useEffect(() => {
    (async () => {
      loadTeam(profile.id).then(setInvites);
      const tp = await loadTourProfile(profile.id);
      if (tp) {
        setCircuit(tp.circuit);
        setRanking(tp.ranking != null ? String(tp.ranking) : "");
        setPoints(tp.points != null ? String(tp.points) : "");
        setPassports([tp.passports[0] ?? "", tp.passports[1] ?? ""]);
        setTaxResidence(tp.tax_residence ?? "");
        setEstaStatus(tp.esta_status);
        setEstaExpiry(tp.esta_expiry ?? "");
        setTeam(tp.team ?? []);
      }
      setLoaded(true);
    })();
  }, [profile.id]);

  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

  async function save() {
    setSaving(true);
    await saveTourProfile(profile.id, {
      circuit,
      ranking: numOrNull(ranking),
      points: numOrNull(points),
      passports: passports.filter((p) => p.trim()),
      tax_residence: taxResidence || null,
      esta_status: estaStatus,
      esta_expiry: estaStatus && estaStatus !== "None" ? estaExpiry || null : null,
      team,
    });
    setSaving(false);
    closeSubView();
  }

  function setRole(role: string, name: string) {
    const others = team.filter((m) => m.role !== role);
    setTeam(name.trim() ? [...others, { role, name }] : others);
  }

  if (!loaded) return <div className="flex h-full items-center justify-center bg-white text-neutral-400">…</div>;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("mode.editProfileTitle")} />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {/* Circuit */}
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-600">{t("onboarding.circuitTitle")}</p>
          <div className="space-y-2">
            {CIRCUITS.map((c) => (
              <button key={c.value} type="button" onClick={() => setCircuit(c.value)} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${circuit === c.value ? "bg-matchup/10 text-matchup ring-1 ring-matchup" : "bg-black/[0.04] text-neutral-700"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ranking + Punkte */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-600">{t("mode.ranking")}</p>
            <input value={ranking} onChange={(e) => setRanking(e.target.value)} inputMode="numeric" placeholder="127" className={inp} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-600">{t("mode.points")}</p>
            <input value={points} onChange={(e) => setPoints(e.target.value)} inputMode="numeric" placeholder="485" className={inp} />
          </div>
        </div>

        {/* Pässe + Steuer */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-neutral-600">{t("onboarding.passportPrimary")}</p>
          <input value={passports[0]} onChange={(e) => setPassports([e.target.value, passports[1]])} placeholder={t("onboarding.passportPlaceholder")} className={inp} />
          <p className="pt-1 text-sm font-semibold text-neutral-600">{t("onboarding.passportSecond")}</p>
          <input value={passports[1]} onChange={(e) => setPassports([passports[0], e.target.value])} placeholder={t("onboarding.passportAdd")} className={inp} />
          <p className="pt-1 text-sm font-semibold text-neutral-600">{t("onboarding.taxResidence")}</p>
          <input value={taxResidence} onChange={(e) => setTaxResidence(e.target.value)} placeholder={t("onboarding.taxPlaceholder")} className={inp} />
        </div>

        {/* ESTA */}
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-600">{t("onboarding.usAuth")}</p>
          <div className="flex flex-wrap gap-2">
            {ESTA_OPTS.map((o) => (
              <button key={o} type="button" onClick={() => setEstaStatus(o)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${estaStatus === o ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>
                {o === "None" ? t("onboarding.usNone") : o}
              </button>
            ))}
          </div>
          {estaStatus && estaStatus !== "None" && (
            <>
              <p className="mt-3 mb-2 text-sm font-semibold text-neutral-600">{t("onboarding.usExpiry")}</p>
              <input type="date" value={estaExpiry} onChange={(e) => setEstaExpiry(e.target.value)} className={inp} />
            </>
          )}
        </div>

        {/* Team */}
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-600">{t("onboarding.teamTitle")}</p>
          <div className="space-y-3">
            {ROLES.map((r) => {
              const inv = invites.find((i) => i.role === r);
              return (
                <div key={r}>
                  <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-neutral-500">
                    {t(ROLE_KEY[r])}
                    {inv?.status === "active" && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{inv.member_name ? inv.member_name : t("mode.teamActive")}</span>}
                  </p>
                  <div className="flex gap-2">
                    <input value={team.find((m) => m.role === r)?.name ?? ""} onChange={(e) => setRole(r, e.target.value)} placeholder={t("onboarding.teamNamePlaceholder")} className={`${inp} flex-1`} />
                    {inv ? (
                      <button type="button" onClick={async () => { if (!window.confirm(t("mode.removeConfirm"))) return; await removeInvite(inv.id); setInvites(await loadTeam(profile.id)); }} className="shrink-0 rounded-xl bg-black/[0.05] px-3 text-[12px] font-bold text-red-500">
                        {t("mode.remove")}
                      </button>
                    ) : (
                      <button type="button" onClick={() => copyInvite(r)} className="shrink-0 rounded-xl bg-black/[0.05] px-3 text-[12px] font-bold text-matchup">
                        {copied === r ? t("mode.copied") : t("mode.invite")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">{t("mode.teamInviteHint")}</p>
        </div>
      </div>

      <div className="shrink-0 border-t border-black/10 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={save} disabled={saving} className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? t("mode.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
