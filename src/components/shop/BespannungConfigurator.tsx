"use client";

import { useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Bespannungs-Konfigurator: Pro-Setup wählen → perfektes Setup ansehen →
   direkt als Besaitungs-Auftrag bestellen (mit Settings & Instruktion).
   ────────────────────────────────────────────────────────────────────────── */

type Setup = {
  id: string;
  pro: string;
  sport: string;
  brand: string;
  strings: string[]; // eine Zeile = eine Saite (Hybrid = 2 Zeilen)
  tension: string;
  traits: string[];
  instruction: string;
  price: number;
};

const SETUPS: Setup[] = [
  {
    id: "alcaraz",
    pro: "Carlos Alcaraz",
    sport: "Tennis",
    brand: "Babolat",
    strings: ["Babolat RPM Blast 1.30 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Maximaler Spin", "Kontrolle", "Haltbarkeit"],
    instruction:
      "Voll-Polyester-Setup für aggressives Topspin-Spiel. Empfohlen für fortgeschrittene Spieler mit langen, schnellen Schwüngen.",
    price: 45,
  },
  {
    id: "federer",
    pro: "Roger Federer",
    sport: "Tennis",
    brand: "Wilson",
    strings: [
      "Längs: Wilson Natural Gut 1.30",
      "Quer: Luxilon ALU Power Rough 1.25",
    ],
    tension: "ca. 26,5 kg / 58,5 lbs",
    traits: ["Touch & Gefühl", "Komfort", "Präzision"],
    instruction:
      "Premium-Hybrid aus Naturdarm und Polyester — weiches, kontrolliertes Spielgefühl mit viel Touch am Netz. Ideal für variantenreiches Allround-Spiel.",
    price: 59,
  },
  {
    id: "djokovic",
    pro: "Novak Djokovic",
    sport: "Tennis",
    brand: "Head",
    strings: [
      "Längs: Babolat VS Touch Naturdarm 1.30",
      "Quer: Luxilon ALU Power 1.25",
    ],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Kontrolle", "Komfort", "Armschonend"],
    instruction:
      "Hybrid für maximale Ballkontrolle bei gleichzeitig hohem Komfort — die Wahl für präzises, defensiv-stabiles Grundlinienspiel.",
    price: 59,
  },
  {
    id: "sinner",
    pro: "Jannik Sinner",
    sport: "Tennis",
    brand: "Head",
    strings: ["Head Lynx Tour 1.25 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Power", "Kontrolle", "Flaches Spiel"],
    instruction:
      "Glattes Polyester für flaches, druckvolles Spiel mit sauberer Kontrolle. Für Spieler, die hart und früh den Ball nehmen.",
    price: 45,
  },
  {
    id: "swiatek",
    pro: "Iga Świątek",
    sport: "Tennis",
    brand: "Tecnifibre",
    strings: ["Tecnifibre Razor Code 1.25 (Längs & Quer)"],
    tension: "ca. 26 kg / 57 lbs",
    traits: ["Spin", "Kontrolle", "Snapback"],
    instruction:
      "Kantiges Polyester für extremen Spin und scharfe Kontrolle — perfekt für aggressives, drehungsreiches Damen- wie Herrenspiel.",
    price: 45,
  },
  {
    id: "nadal",
    pro: "Rafael Nadal",
    sport: "Tennis",
    brand: "Babolat",
    strings: ["Babolat RPM Blast 1.35 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Extremer Spin", "Haltbarkeit", "Power"],
    instruction:
      "Dickes Polyester für brutalen Topspin und maximale Haltbarkeit. Für kräftige Schwünge und langes Grundlinien-Duell.",
    price: 45,
  },
];

export default function BespannungConfigurator() {
  const [selected, setSelected] = useState<Setup | null>(null);
  const [ordered, setOrdered] = useState(false);

  if (ordered && selected) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)] sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">
          ✓
        </div>
        <h3 className="mt-6 text-2xl font-bold tracking-tight">
          Besaitungs-Auftrag erstellt
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
          Dein Schläger wird im <strong>{selected.pro}</strong>-Setup besaitet:
          <br />
          {selected.strings.join(" · ")} — {selected.tension}.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
          Schick uns deinen Schläger ein — wir besaiten ihn exakt nach diesen
          Settings und schicken ihn spielfertig zurück.
        </p>
        <button
          type="button"
          onClick={() => {
            setOrdered(false);
            setSelected(null);
          }}
          className="mt-8 h-12 rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Weiteres Setup wählen
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)] sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Spiele wie die Profis
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Wähle ein Pro-Setup — wir zeigen dir die exakte Saite & Spannung und
        besaiten deinen Schläger genau so.
      </p>

      {/* Pro-Auswahl */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SETUPS.map((s) => {
          const active = selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                active
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 hover:border-black"
              }`}
            >
              <div className="text-sm font-bold tracking-tight">{s.pro}</div>
              <div
                className={`mt-0.5 text-[11px] ${active ? "text-white/60" : "text-neutral-500"}`}
              >
                {s.brand} · {s.sport}
              </div>
            </button>
          );
        })}
      </div>

      {/* Setup-Detail */}
      {selected ? (
        <div className="mt-7 rounded-2xl bg-neutral-50 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-matchup">
            Dein perfektes Setup
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">
            {selected.pro}
          </h3>

          <div className="mt-5 space-y-3">
            <Row label="Saite">
              <div className="space-y-0.5">
                {selected.strings.map((str) => (
                  <div key={str}>{str}</div>
                ))}
              </div>
            </Row>
            <Row label="Spannung">{selected.tension}</Row>
            <Row label="Schläger-Marke">{selected.brand}</Row>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selected.traits.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
              >
                {t}
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            {selected.instruction}
          </p>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-5 sm:flex-row">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-bold tracking-tight">
                {selected.price} €
              </div>
              <div className="text-xs text-neutral-500">
                inkl. Premium-Saite & Bespannung
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOrdered(true)}
              className="w-full rounded-full bg-matchup px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-matchup-hover sm:w-auto"
            >
              Mit diesem Setup bestellen →
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-7 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          Wähle oben ein Pro-Setup, um Saite, Spannung und Details zu sehen.
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-28 shrink-0 text-neutral-500">{label}</span>
      <span className="font-medium text-black">{children}</span>
    </div>
  );
}
