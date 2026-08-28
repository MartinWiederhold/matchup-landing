"use client";

import { useCallback, useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { TIME_BLOCKS, weekDates, isPastSlot } from "@/domain/tour/trainingSlots";
import {
  loadTournamentSlots, loadSlotPeople, addSlot, removeSlot, respondToSlot, removeResponse, setResponseStatus,
  type TrainingSlot, type SlotResponse, type SlotPerson,
} from "@/lib/tourTrainingSlots";
import TourChatPanel from "./TourChatPanel";

// getUTCDay()-Index → Wochentag-Code (für die i18n-Kürzel Mo…So).
const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Trainingsslots im „Vor Ort"-Reiter: eigene Slots anbieten (Tag der Turnierwoche + Zeitblock),
 * fremde Slots sehen und sich melden, eingehende Anfragen zu-/absagen. Vergangene Tage fallen
 * weg. Das Melden läuft über die Antwort-Tabelle (Status), NICHT über den Chat (may_match).
 */
export default function TrainingSlots({ tournamentId, tournamentMonday, viewerId, viewerContact, nowMs }: {
  tournamentId: string; tournamentMonday: string; viewerId: string; viewerContact: string | null; nowMs: number;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [responses, setResponses] = useState<SlotResponse[]>([]);
  const [people, setPeople] = useState<Map<string, SlotPerson>>(new Map());
  const [busy, setBusy] = useState(false);
  // Nach einer Zusage: Chat auf Knopfdruck öffnen (nicht automatisch) — may_match-Zweig 4 trägt.
  const [chatWith, setChatWith] = useState<{ id: string; name: string } | null>(null);
  const today = new Date(nowMs).toISOString().slice(0, 10);

  const reload = useCallback(async () => {
    const { slots, responses } = await loadTournamentSlots(tournamentId);
    setSlots(slots);
    setResponses(responses);
    setPeople(await loadSlotPeople([...slots.map((s) => s.user_id), ...responses.map((r) => r.responder_id)]));
  }, [tournamentId]);
  useEffect(() => { let a = true; reload().catch(() => { /* still */ }); return () => { a = false; void a; }; }, [reload]);

  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); await reload(); } finally { setBusy(false); } };
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const wdLabel = (iso: string) => t(`tour.day_${WD[new Date(iso + "T00:00:00Z").getUTCDay()]}`);
  const blockLabel = (code: string) => t(`tour.tsBlock_${code}`);
  const personName = (id: string) => people.get(id)?.display_name || people.get(id)?.first_name || t("tour.fieldMissing");

  const mySlots = slots.filter((s) => s.user_id === viewerId);
  const mySlotIds = new Set(mySlots.map((s) => s.id));
  const slotById = new Map(slots.map((s) => [s.id, s]));
  const futureDays = weekDates(tournamentMonday).filter((d) => !isPastSlot(d, today));
  const otherSlots = slots.filter((s) => s.user_id !== viewerId && !isPastSlot(s.slot_date, today));
  // Eingehende Anfragen zu MEINEN (künftigen) Slots.
  const incoming = responses.filter((r) => mySlotIds.has(r.slot_id) && slotById.get(r.slot_id) && !isPastSlot(slotById.get(r.slot_id)!.slot_date, today));

  const toggle = (date: string, block: string) => {
    const mine = mySlots.find((s) => s.slot_date === date && s.time_block === block);
    return run(() => (mine ? removeSlot(mine.id) : addSlot(viewerId, tournamentId, date, block)));
  };
  const myResponseFor = (slotId: string) => responses.find((r) => r.slot_id === slotId && r.responder_id === viewerId);

  const chip = (on: boolean) => `t2-chip ${on ? "is-on" : ""}`;
  const statusLabel = (s: string) => t(`tour.tsStatus_${s}`);

  return (
    <section className="mt-4">
      <p className="t2-section-title">{t("tour.tsTitle")}</p>

      {/* ── Meine Slots (Editor) ─────────────────────────────────────────────── */}
      <div className="mt-2 rounded-xl border border-[var(--t2-accent)]/20 bg-[var(--t2-accent)]/5 p-3">
        <p className="t2-fs-body-sm font-bold text-[var(--t2-ink)]">{t("tour.tsMineTitle")}</p>
        <p className="mt-0.5 t2-fs-meta text-[var(--t2-muted)]">{t("tour.tsMineHint")}</p>
        {futureDays.length === 0 ? (
          <p className="mt-2 t2-fs-micro text-[var(--t2-faint)]">{t("tour.tsWeekOver")}</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {futureDays.map((date) => (
              <div key={date} className="flex items-center gap-2">
                <span className="w-16 shrink-0 t2-fs-micro font-semibold text-[var(--t2-muted)]">{wdLabel(date)} {fmtDay(date)}</span>
                <div className="flex flex-wrap gap-1">
                  {TIME_BLOCKS.map((b) => (
                    <button key={b.code} type="button" disabled={busy} onClick={() => toggle(date, b.code)} className={chip(mySlots.some((s) => s.slot_date === date && s.time_block === b.code))}>{blockLabel(b.code)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Anfragen an meine Slots ──────────────────────────────────────────── */}
      {incoming.length > 0 && (
        <div className="mt-3">
          <p className="t2-fs-micro font-bold text-[var(--t2-ink)]">{t("tour.tsIncomingTitle")} · {incoming.length}</p>
          <div className="mt-1.5 space-y-1.5">
            {incoming.map((r) => {
              const s = slotById.get(r.slot_id)!;
              return (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--t2-line)] px-2.5 py-2">
                  <span className="min-w-0">
                    <span className="block truncate t2-fs-body-sm font-semibold text-[var(--t2-ink)]">{personName(r.responder_id)}</span>
                    <span className="block truncate t2-fs-meta text-[var(--t2-muted)]">{wdLabel(s.slot_date)} {fmtDay(s.slot_date)} · {blockLabel(s.time_block)}{r.contact ? ` · ${r.contact}` : ""}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {r.status === "pending" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => run(() => setResponseStatus(r.id, "accepted"))} className="rounded-full bg-[var(--t2-accent)] px-2.5 py-1.5 t2-fs-meta font-bold text-[var(--t2-on-accent)] hover:bg-[var(--t2-accent)]-hover disabled:opacity-50">{t("tour.tsAccept")}</button>
                        <button type="button" disabled={busy} onClick={() => run(() => setResponseStatus(r.id, "declined"))} className="rounded-full bg-[var(--t2-surface)] px-2.5 py-1.5 t2-fs-meta font-semibold text-[var(--t2-muted)] hover:bg-[var(--t2-line)] disabled:opacity-50">{t("tour.tsDecline")}</button>
                      </>
                    ) : (
                      <>
                        <span className={`rounded-full px-2 py-0.5 t2-fs-meta font-bold ${r.status === "accepted" ? "bg-[var(--t2-success-surface)] text-[var(--t2-success)]" : "bg-[var(--t2-surface)] text-[var(--t2-muted)]"}`}>{statusLabel(r.status)}</span>
                        {r.status === "accepted" && (
                          <button type="button" onClick={() => setChatWith({ id: r.responder_id, name: personName(r.responder_id) })} className="rounded-full bg-[var(--t2-accent)] px-2.5 py-1.5 t2-fs-meta font-bold text-[var(--t2-on-accent)] hover:bg-[var(--t2-accent)]-hover">{t("tour.tsChat")}</button>
                        )}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Slots vor Ort (andere) ───────────────────────────────────────────── */}
      <div className="mt-3">
        <p className="t2-fs-micro font-bold text-[var(--t2-ink)]">{t("tour.tsOthersTitle")}</p>
        {otherSlots.length === 0 ? (
          <p className="mt-1 t2-fs-micro text-[var(--t2-faint)]">{t("tour.tsEmptyOthers")}</p>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {otherSlots.map((s) => {
              const my = myResponseFor(s.id);
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--t2-line)] px-2.5 py-2">
                  <span className="min-w-0">
                    <span className="block truncate t2-fs-body-sm font-semibold text-[var(--t2-ink)]">{personName(s.user_id)}</span>
                    <span className="block truncate t2-fs-meta text-[var(--t2-muted)]">{wdLabel(s.slot_date)} {fmtDay(s.slot_date)} · {blockLabel(s.time_block)}</span>
                  </span>
                  {my ? (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 t2-fs-meta font-bold ${my.status === "accepted" ? "bg-[var(--t2-success-surface)] text-[var(--t2-success)]" : my.status === "declined" ? "bg-[var(--t2-surface)] text-[var(--t2-muted)]" : "bg-[var(--t2-warn-surface)] text-[var(--t2-warn)]"}`}>{t(`tour.tsMyResp_${my.status}`)}</span>
                      {my.status === "accepted"
                        ? <button type="button" onClick={() => setChatWith({ id: s.user_id, name: personName(s.user_id) })} className="rounded-full bg-[var(--t2-accent)] px-2.5 py-1.5 t2-fs-meta font-bold text-[var(--t2-on-accent)] hover:bg-[var(--t2-accent)]-hover">{t("tour.tsChat")}</button>
                        : <button type="button" disabled={busy} onClick={() => run(() => removeResponse(my.id))} aria-label={t("tour.tsWithdraw")} className="text-[var(--t2-faint)] hover:text-[var(--t2-danger)]">✕</button>}
                    </span>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => run(() => respondToSlot(s.id, viewerId, viewerContact))} className="shrink-0 rounded-full bg-[var(--t2-accent)] px-2.5 py-1.5 t2-fs-meta font-bold text-[var(--t2-on-accent)] hover:bg-[var(--t2-accent)]-hover disabled:opacity-50">{t("tour.tsRespond")}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="mt-1.5 t2-fs-meta leading-relaxed text-[var(--t2-faint)]">{t("tour.tsNote")}</p>

      {chatWith && (
        <TourChatPanel meId={viewerId} otherId={chatWith.id} otherName={chatWith.name} onClose={() => setChatWith(null)} />
      )}
    </section>
  );
}
