"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { addEvent, updateEvent, EVENT_KINDS, type EventInput, type EventKind, type TourEvent } from "@/lib/tourEvents";
import type { SeasonEntry } from "@/lib/tourSeason";

const inputCls = "t2-input";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Termin anlegen/bearbeiten. Art dezent (Akzent bei Auswahl, KEINE Ampelfarben).
 * Match-Felder erscheinen nur bei kind='match'; auf null gezwungen wird in der
 * Datenschicht. Ergebnis ist Freitext mit Platzhalter/Hinweis (nicht erzwungen).
 */
export default function EventForm({
  event,
  season,
  userId,
  defaultDate,
  defaultKind,
  defaultTime,
  onDone,
}: {
  event: TourEvent | null; // null = neu
  season: SeasonEntry[];
  userId: string;
  defaultDate: string;
  defaultKind?: EventKind; // Vorwahl der Art (z. B. beim Anlegen aus einer Zeitstrahl-Spur)
  defaultTime?: string; // Vorwahl der Startzeit "HH:MM" (Klick ins Zeitraster)
  onDone: () => void;
}) {
  const t = useT();

  const [kind, setKind] = useState<EventKind>(
    event && (EVENT_KINDS as string[]).includes(event.kind) ? (event.kind as EventKind) : (defaultKind ?? "training"),
  );
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.event_date ?? defaultDate ?? todayISO());
  const [time, setTime] = useState(event?.event_time ? event.event_time.slice(0, 5) : (defaultTime ?? ""));
  const [end, setEnd] = useState(event?.end_time ? event.end_time.slice(0, 5) : "");
  const [note, setNote] = useState(event?.note ?? "");
  const [tournamentId, setTournamentId] = useState(event?.tournament_id ?? "");
  const [round, setRound] = useState(event?.round ?? "");
  const [opponent, setOpponent] = useState(event?.opponent ?? "");
  const [score, setScore] = useState(event?.score ?? "");
  const [won, setWon] = useState<boolean | null>(event?.won ?? null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"" | "title" | "save">("");

  async function save() {
    if (busy) return;
    setError("");
    if (!title.trim()) { setError("title"); return; }
    const input: EventInput = {
      kind,
      title: title.trim(),
      event_date: date,
      event_time: time.trim() === "" ? null : time,
      end_time: end.trim() === "" ? null : end,
      note: note.trim() === "" ? null : note.trim(),
      // /tour speichert nur uuids aus der eigenen Saison (Auswahl unten), sonst null.
      tournament_id: tournamentId || null,
      round: round.trim() === "" ? null : round.trim(),
      opponent: opponent.trim() === "" ? null : opponent.trim(),
      score: score.trim() === "" ? null : score.trim(),
      won,
    };
    setBusy(true);
    try {
      if (event) await updateEvent(event.id, input);
      else await addEvent(userId, input);
      onDone();
    } catch {
      setError("save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="t2-panel">
      <h2 className="t2-kicker">
        {event ? t("tour.calEditTitle") : t("tour.calAddTitle")}
      </h2>

      {/* Art als Chips — dezenter Akzent, keine Ampelfarben */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {EVENT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`t2-chip ${kind === k ? "is-on" : ""}`}
          >
            {t(`tour.calKind_${k}`)}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calFieldTitle")}</span>
          <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calDate")}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calTime")}</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calTimeEnd")}</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={time.trim() === ""} className={`${inputCls} disabled:opacity-40`} />
          </label>
        </div>
        <p className="t2-fs-meta text-[var(--t2-faint)] sm:col-span-2 -mt-1">{t("tour.calTimeHint")}</p>
        <label className="block sm:col-span-2">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calNote")}</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calTournament")}</span>
          <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className={inputCls}>
            <option value="">{t("tour.calTournamentNone")}</option>
            {season.map((e) => (
              <option key={e.tournament.id} value={e.tournament.id}>
                {e.tournament.city || e.tournament.id}{e.tournament.country ? `, ${e.tournament.country}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Match-Felder nur bei kind='match' */}
      {kind === "match" && (
        <div className="mt-3 space-y-3 rounded-xl border border-[var(--t2-line)] bg-[var(--t2-surface)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calRound")}</span>
              <input type="text" value={round} onChange={(e) => setRound(e.target.value)} placeholder={t("tour.calRoundPlaceholder")} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calOpponent")}</span>
              <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]">{t("tour.calScore")}</span>
            <input type="text" value={score} onChange={(e) => setScore(e.target.value)} placeholder={t("tour.calScorePlaceholder")} className={inputCls} />
            <span className="mt-1 block t2-fs-meta text-[var(--t2-faint)]">{t("tour.calScoreHint")}</span>
          </label>
          {/* Sieg/Niederlage/kein Ergebnis — dezent, ohne Ampelfarben */}
          <div className="flex gap-2">
            {([["calWon", true], ["calLost", false], ["calNoResult", null]] as const).map(([k, val]) => (
              <button
                key={k}
                type="button"
                onClick={() => setWon(val)}
                className={`flex-1 rounded-xl py-2 t2-fs-micro font-semibold transition-colors ${
                  won === val ? "bg-[var(--t2-ink)] text-[var(--t2-on-accent)]" : "bg-[var(--t2-paper)] text-[var(--t2-muted)] ring-1 ring-[var(--t2-line)]"
                }`}
              >
                {t(`tour.${k}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="t2-cta disabled:opacity-50">
          {t("tour.calSave")}
        </button>
        <button type="button" onClick={onDone} className="t2-fs-body-sm font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)]">{t("tour.calCancel")}</button>
        {error === "title" && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.calNeedTitle")}</span>}
        {error === "save" && <span className="t2-fs-micro text-[var(--t2-muted)]">{t("tour.calSaveError")}</span>}
      </div>
    </section>
  );
}
