"use client";

import { useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import WheelPicker from "./WheelPicker";

const pad = (n: number) => String(n).padStart(2, "0");

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------------- Bottom-Sheet ---------------- */
function Sheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-zinc-950 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white ring-1 ring-white/10 sm:rounded-3xl"
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- Datum ---------------- */
export function DateField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = value ? new Date(value + "T00:00:00") : null;
  const [view, setView] = useState(() => {
    const d = selected ?? today;
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const loc = locale === "de" ? "de-CH" : "en-US";
  const label = selected
    ? new Intl.DateTimeFormat(loc, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(selected)
    : placeholder ?? "";

  // Kalenderraster (Montag zuerst)
  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7; // Mo=0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.y, view.m, d));

  const weekdays =
    locale === "de"
      ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
      : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthLabel = new Intl.DateTimeFormat(loc, {
    month: "long",
    year: "numeric",
  }).format(first);

  function shift(delta: number) {
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full rounded-xl bg-zinc-800 px-4 py-3 text-left text-sm ${
          selected ? "text-white" : "text-zinc-500"
        }`}
      >
        {label}
      </button>

      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-bold capitalize">{monthLabel}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-lg"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => shift(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-lg"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((w) => (
              <div key={w} className="py-1 text-[11px] font-semibold text-zinc-500">
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const isPast = d < today;
              const isSel = selected && ymd(d) === ymd(selected);
              const isToday = ymd(d) === ymd(today);
              return (
                <button
                  key={ymd(d)}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    onChange(ymd(d));
                    setOpen(false);
                  }}
                  className={`flex h-10 items-center justify-center rounded-full text-sm transition-colors ${
                    isSel
                      ? "bg-matchup font-bold text-white"
                      : isPast
                        ? "text-zinc-700"
                        : isToday
                          ? "bg-zinc-800 text-white"
                          : "text-white hover:bg-zinc-800"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-full bg-zinc-800 py-3 text-sm font-semibold"
          >
            {t("games.pickerDone")}
          </button>
        </Sheet>
      )}
    </>
  );
}

/* ---------------- Uhrzeit ---------------- */
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimeField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [h, m] = value
    ? value.split(":").map((n) => parseInt(n, 10))
    : [new Date().getHours(), 0];

  function setPart(nh: number, nm: number) {
    onChange(`${pad(nh)}:${pad(nm)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full rounded-xl bg-zinc-800 px-4 py-3 text-left text-sm ${
          value ? "text-white" : "text-zinc-500"
        }`}
      >
        {value || placeholder || ""}
      </button>

      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <p className="mb-3 text-center text-base font-bold">
            {pad(h)}:{pad(m)}
          </p>
          <div className="flex items-center justify-center gap-4">
            <WheelPicker
              values={HOURS}
              value={h}
              onChange={(nh) => setPart(nh, m)}
              fade="rgb(9 9 11)"
            />
            <span className="text-2xl font-bold text-zinc-500">:</span>
            <WheelPicker
              values={MINUTES}
              value={m}
              onChange={(nm) => setPart(h, nm)}
              fade="rgb(9 9 11)"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-full bg-matchup py-3 text-sm font-bold text-white"
          >
            {t("games.pickerDone")}
          </button>
        </Sheet>
      )}
    </>
  );
}
