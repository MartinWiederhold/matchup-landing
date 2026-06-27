"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { sportLabel } from "@/lib/utils/formatters";
import type { Sport, GameType } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];

export default function CreateGame() {
  const { profile, closeSubView } = useAppNav();
  const [sport, setSport] = useState<Sport>("tennis");
  const [gameType, setGameType] = useState<GameType>("singles");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [court, setCourt] = useState("");
  const [description, setDescription] = useState("");
  const [maxP, setMaxP] = useState(2);
  const [isOpen, setIsOpen] = useState(true);
  const [booked, setBooked] = useState(false);
  const [saving, setSaving] = useState(false);

  const valid = date && time && location.trim();

  async function submit() {
    if (!valid) return;
    setSaving(true);
    const { error } = await supabase.from("game_events").insert({
      created_by: profile.id,
      sport,
      game_type: gameType,
      date_time: new Date(`${date}T${time}`).toISOString(),
      location: location.trim(),
      court_number: court || null,
      court_booked: booked,
      description: description || null,
      max_participants: maxP,
      is_open: isOpen,
      status: "planned",
    });
    setSaving(false);
    if (!error) closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Spiel erstellen" />
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <Field label="Sportart *">
          <div className="flex gap-2">
            {SPORTS.map((s) => (
              <Pick key={s} active={sport === s} onClick={() => setSport(s)}>
                {sportLabel(s)}
              </Pick>
            ))}
          </div>
        </Field>

        <Field label="Spieltyp *">
          <div className="flex gap-2">
            {(["singles", "doubles"] as GameType[]).map((t) => (
              <Pick
                key={t}
                active={gameType === t}
                onClick={() => {
                  setGameType(t);
                  setMaxP(t === "singles" ? 2 : 4);
                }}
              >
                {t === "singles" ? "Singles" : "Doubles"}
              </Pick>
            ))}
          </div>
        </Field>

        <Field label="Datum *">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Uhrzeit *">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Ort *">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z.B. TC Zürich"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Platznummer">
          <input
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            placeholder="z.B. Platz 3"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Beschreibung">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z.B. Lockeres Spiel, alle Level willkommen"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </Field>
        <Field label="Max. Teilnehmer">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMaxP((n) => Math.max(2, n - 1))}
              className="h-9 w-9 rounded-full bg-zinc-800"
            >
              −
            </button>
            <span className="text-lg font-bold">{maxP}</span>
            <button
              type="button"
              onClick={() => setMaxP((n) => Math.min(8, n + 1))}
              className="h-9 w-9 rounded-full bg-zinc-800"
            >
              +
            </button>
          </div>
        </Field>

        <Toggle label="Offen für alle" value={isOpen} onChange={setIsOpen} />
        <Toggle label="Platz gebucht" value={booked} onChange={setBooked} />
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-5">
        <button
          type="button"
          disabled={!valid || saving}
          onClick={submit}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Wird erstellt…" : "Spiel erstellen"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-300">{label}</p>
      {children}
    </div>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm ${
        active ? "bg-matchup/20 ring-2 ring-matchup" : "bg-zinc-800 ring-1 ring-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-sm"
    >
      <span>{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-matchup" : "bg-zinc-600"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
