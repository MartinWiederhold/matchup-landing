"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import {
  loadTravelDocuments, addTravelDocument, updateTravelDocument, removeTravelDocument,
  type TravelDocInput,
} from "@/lib/tourTravelDocuments";
import type { TourTravelDocument, TravelDocKind, TravelDocStatus } from "@/lib/types";

const inpL = "t2-input";
const inpD = "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none [color-scheme:dark]";
const lblL = "mb-1 block text-[12px] font-semibold text-[var(--t2-muted)]";
const lblD = "mb-1 block text-[12px] font-semibold text-neutral-400";
const cardL = "t2-panel";
const cardD = "border border-white/10 bg-black p-4";
const btn = "t2-cta mt-3 disabled:opacity-50";

const KINDS: TravelDocKind[] = ["esta", "eta", "schengen_visa", "national_visa", "other"];
const STATUSES: TravelDocStatus[] = ["have", "applied", "none"];

const nn = (s: string): string | null => (s.trim() === "" ? null : s.trim());
const intOrNull = (s: string): number | null => { const n = parseInt(s, 10); return s.trim() === "" || Number.isNaN(n) || n < 0 ? null : Math.min(n, 104); };
const emptyDraft: TravelDocInput = { kind: "esta", scope: "US", valid_until: null, status: "have", note: null, lead_weeks: null };

/**
 * Reisedokumente-Ablage auf /tour/setup (web.tour_travel_document, owner-only): mehrere
 * Dokumente je Nutzer (ESTA, Schengen-Visum, eVisa …). Art, Land/Raum, „gültig bis", Status.
 * KEINE Dokumentnummer — dieselbe Regel wie beim Pass. Kein Vorlaufzeit-Feld, solange es
 * dazu keine Warnung gibt (ein Eingabefeld ohne Wirkung wäre irreführend).
 */
export default function TravelDocsCard({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [docs, setDocs] = useState<TourTravelDocument[]>([]);
  const [draft, setDraft] = useState<TravelDocInput>(emptyDraft);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setDocs(await loadTravelDocuments(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    reload().then(() => { if (alive) setStatus("ready"); }).catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user, reload]);

  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const kindLabel = (k: TravelDocKind) => t(`tour.tdKind_${k}`);
  const scopeLabel = (s: string | null) => (s === "SCHENGEN" ? t("tour.tdSchengen") : s ?? "");

  // Schengen-Visum gilt für den Raum → scope fix 'SCHENGEN'. Sonst ISO2-Land (bei 'other' optional).
  const draftIsSchengen = draft.kind === "schengen_visa";
  const draftScope = draftIsSchengen ? "SCHENGEN" : draft.scope;
  const canAdd = draft.kind === "other" || !!draftScope;

  // Best effort: ein Fehler (z. B. Duplikat, unique kind+scope) darf keine unbehandelte
  // Rejection werfen — Zustand neu laden und weiter.
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch { /* ignorieren */ } finally { await reload().catch(() => {}); setBusy(false); } };

  const add = () => run(async () => {
    await addTravelDocument(user!.id, { ...draft, scope: draftScope });
    setDraft(emptyDraft);
  });

  const dark = tone === "dark";
  const inp = dark ? inpD : inpL;
  const lbl = dark ? lblD : lblL;
  const card = dark ? cardD : cardL;
  const title = dark ? "text-white" : "text-[var(--t2-ink)]";
  const muted = dark ? "text-neutral-400" : "text-[var(--t2-muted)]";
  const row = dark ? "rounded-xl border border-white/10 px-3 py-2" : "rounded-xl border border-[var(--t2-line)] px-3 py-2";
  const pill = dark ? "rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-neutral-300" : "rounded-full bg-[var(--t2-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--t2-muted)]";
  const mini = dark ? "rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-[12px] text-white [color-scheme:dark]" : "rounded-lg border border-[var(--t2-line)] bg-white px-2 py-1 text-[12px]";

  if (authLoading || status === "loading") return null; // Auth/Laden zeigt bereits PlayerMasterForm
  if (!user) return null;
  if (status === "error") return <p className={`mt-4 text-sm ${muted}`}>{t("tour.loadError")}</p>;

  return (
    <div className={`${card} mt-4`}>
      <h3 className={`text-[13px] font-bold ${title}`}>{t("tour.tdTitle")}</h3>
      <p className={`mt-1 text-[12px] ${muted}`}>{t("tour.tdIntro")}</p>

      {/* Bestehende Dokumente */}
      {docs.length === 0 ? (
        <p className={`mt-3 text-[12px] ${dark ? "text-neutral-500" : "text-[var(--t2-faint)]"}`}>{t("tour.tdEmpty")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {docs.map((d) => (
            <div key={d.id} className={`flex flex-wrap items-center gap-2 ${row}`}>
              <span className={`text-[13px] font-semibold ${title}`}>{kindLabel(d.kind)}</span>
              {d.scope && <span className={pill}>{scopeLabel(d.scope)}</span>}
              <select value={d.status} onChange={(e) => run(() => updateTravelDocument(d.id, { status: e.target.value as TravelDocStatus }))} disabled={busy} className={mini}>
                {STATUSES.map((s) => <option key={s} value={s}>{t(`tour.tdStatus_${s}`)}</option>)}
              </select>
              <input type="date" value={d.valid_until ?? ""} onChange={(e) => run(() => updateTravelDocument(d.id, { valid_until: nn(e.target.value) }))} disabled={busy} className={mini} />
              {d.valid_until && <span className="text-[11px] text-[var(--t2-faint)]">{t("tour.tdValidUntilShort", { date: fmtDay(d.valid_until) })}</span>}
              <label className="flex items-center gap-1 text-[11px] text-[var(--t2-muted)]">
                <input type="number" min={0} max={104} value={d.lead_weeks ?? ""} onChange={(e) => run(() => updateTravelDocument(d.id, { lead_weeks: intOrNull(e.target.value) }))} disabled={busy} placeholder="—" className={`w-14 ${mini}`} />
                {t("tour.tdLeadUnit")}
              </label>
              <button type="button" onClick={() => run(() => removeTravelDocument(d.id))} disabled={busy} className="ml-auto text-[12px] font-semibold text-[var(--t2-faint)] hover:text-red-500">{t("tour.tdRemove")}</button>
            </div>
          ))}
        </div>
      )}

      {/* Neues Dokument */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block"><span className={lbl}>{t("tour.tdKind")}</span>
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as TravelDocKind })} className={inp}>
            {KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
          </select>
        </label>
        <label className="block"><span className={lbl}>{t("tour.tdScope")}</span>
          {draftIsSchengen
            ? <input value={t("tour.tdSchengen")} disabled className={`${inp} opacity-60`} />
            : <input value={draft.scope ?? ""} onChange={(e) => setDraft({ ...draft, scope: nn(e.target.value.toUpperCase().slice(0, 2)) })} placeholder="US" className={inp} />}
        </label>
        <label className="block"><span className={lbl}>{t("tour.tdValidUntil")}</span>
          <input type="date" value={draft.valid_until ?? ""} onChange={(e) => setDraft({ ...draft, valid_until: nn(e.target.value) })} className={inp} />
        </label>
        <label className="block"><span className={lbl}>{t("tour.tdStatus")}</span>
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TravelDocStatus })} className={inp}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`tour.tdStatus_${s}`)}</option>)}
          </select>
        </label>
        <label className="block"><span className={lbl}>{t("tour.tdLeadWeeks")}</span>
          <input type="number" min={0} max={104} value={draft.lead_weeks ?? ""} onChange={(e) => setDraft({ ...draft, lead_weeks: intOrNull(e.target.value) })} placeholder="6" className={inp} />
        </label>
        {draft.kind === "other" && (
          <label className="block sm:col-span-2 lg:col-span-4"><span className={lbl}>{t("tour.tdNote")}</span>
            <input value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: nn(e.target.value.slice(0, 200)) })} placeholder={t("tour.tdNotePlaceholder")} className={inp} />
          </label>
        )}
      </div>
      <p className="mt-2 text-[11px] text-[var(--t2-faint)]">{t("tour.tdLeadHint")}</p>
      <p className="mt-1 text-[11px] text-[var(--t2-faint)]">{t("tour.tdNoNumber")}</p>
      <button type="button" onClick={add} disabled={busy || !canAdd} className={btn}>{t("tour.tdAdd")}</button>
    </div>
  );
}
