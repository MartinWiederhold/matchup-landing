"use client";

import { useState } from "react";
import Image from "next/image";

/* ──────────────────────────────────────────────────────────────────────────
   Bespannungs-Konfigurator
   - Setup vom Lieblingsspieler wählen (Top-Spieler) → perfektes Setup → bestellen
   - oder eigenes Setup per Anfrageformular
   ────────────────────────────────────────────────────────────────────────── */

type Setup = {
  id: string;
  pro: string;
  tag: string;
  brand: string;
  img?: string;
  accent: string; // Gradient für Monogramm-Avatar
  strings: string[];
  tension: string;
  traits: string[];
  instruction: string;
  price: number;
};

const SETUPS: Setup[] = [
  {
    id: "alcaraz",
    pro: "Carlos Alcaraz",
    tag: "ATP #1",
    brand: "Babolat",
    img: "/beratung/pros/alcaraz.jpg",
    accent: "from-orange-400 to-red-500",
    strings: ["Babolat RPM Blast 1.30 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Maximaler Spin", "Kontrolle", "Haltbarkeit"],
    instruction:
      "Voll-Polyester für aggressives Topspin-Spiel. Für fortgeschrittene Spieler mit langen, schnellen Schwüngen.",
    price: 45,
  },
  {
    id: "sinner",
    pro: "Jannik Sinner",
    tag: "ATP Top 10",
    brand: "Head",
    accent: "from-amber-400 to-orange-600",
    strings: ["Head Lynx Tour 1.25 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Power", "Kontrolle", "Flaches Spiel"],
    instruction:
      "Glattes Polyester für flaches, druckvolles Spiel mit sauberer Kontrolle. Für hartes, frühes Spiel.",
    price: 45,
  },
  {
    id: "zverev",
    pro: "Alexander Zverev",
    tag: "ATP Top 10",
    brand: "Head",
    img: "/beratung/pros/zverev.jpg",
    accent: "from-sky-400 to-blue-600",
    strings: ["Head Hawk Touch 1.30 (Längs & Quer)"],
    tension: "ca. 23 kg / 51 lbs",
    traits: ["Power", "Komfort", "Kontrolle"],
    instruction:
      "Weiches Polyester bei niedriger Spannung — viel Power und Armschonung bei stabiler Kontrolle.",
    price: 45,
  },
  {
    id: "djokovic",
    pro: "Novak Djokovic",
    tag: "24× Grand Slam",
    brand: "Head",
    accent: "from-blue-500 to-indigo-600",
    strings: [
      "Längs: Babolat VS Touch Naturdarm 1.30",
      "Quer: Luxilon ALU Power 1.25",
    ],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Kontrolle", "Komfort", "Armschonend"],
    instruction:
      "Hybrid für maximale Ballkontrolle bei hohem Komfort — für präzises, defensiv-stabiles Grundlinienspiel.",
    price: 59,
  },
  {
    id: "medvedev",
    pro: "Daniil Medvedev",
    tag: "ATP Top 10",
    brand: "Tecnifibre",
    accent: "from-rose-400 to-pink-600",
    strings: ["Tecnifibre Razor Code 1.25 (Längs & Quer)"],
    tension: "ca. 26 kg / 57 lbs",
    traits: ["Kontrolle", "Touch", "Präzision"],
    instruction:
      "Kontrolliertes Polyester für flaches, präzises Spiel von tief hinter der Grundlinie.",
    price: 45,
  },
  {
    id: "fritz",
    pro: "Taylor Fritz",
    tag: "ATP Top 10",
    brand: "Head",
    accent: "from-red-400 to-rose-600",
    strings: ["Solinco Hyper-G 1.25 (Längs & Quer)"],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Power", "Spin", "Aufschlag"],
    instruction:
      "Kantiges Polyester für druckvolle Aufschläge und Spin. Für offensives, kraftvolles Spiel.",
    price: 45,
  },
  {
    id: "ruud",
    pro: "Casper Ruud",
    tag: "ATP Top 10",
    brand: "Yonex",
    accent: "from-emerald-400 to-teal-600",
    strings: ["Yonex Poly Tour Pro 1.25 (Längs & Quer)"],
    tension: "ca. 25,5 kg / 56 lbs",
    traits: ["Spin", "Komfort", "Sandplatz"],
    instruction:
      "Komfortables Polyester mit viel Spin — ideal für drehungsreiches Grundlinienspiel, besonders auf Sand.",
    price: 45,
  },
  {
    id: "rublev",
    pro: "Andrey Rublev",
    tag: "ATP Top 10",
    brand: "Head",
    accent: "from-zinc-400 to-zinc-600",
    strings: ["Head Hawk 1.25 (Längs & Quer)"],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Power", "Spin", "Haltbarkeit"],
    instruction:
      "Robustes Polyester für volle Schläge mit Spin und Power. Für kompromisslos offensives Spiel.",
    price: 45,
  },
  {
    id: "tsitsipas",
    pro: "Stefanos Tsitsipas",
    tag: "ATP Top 10",
    brand: "Wilson",
    accent: "from-cyan-400 to-sky-600",
    strings: ["Luxilon ALU Power 1.25 (Längs & Quer)"],
    tension: "ca. 26 kg / 57 lbs",
    traits: ["Spin", "Power", "Einhand-Rückhand"],
    instruction:
      "Tour-Klassiker aus Polyester für Spin und Kontrolle — perfekt für variantenreiches Allcourt-Spiel.",
    price: 45,
  },
  {
    id: "dimitrov",
    pro: "Grigor Dimitrov",
    tag: "ATP Top 15",
    brand: "Wilson",
    accent: "from-violet-400 to-purple-600",
    strings: [
      "Längs: Wilson Natural Gut 1.30",
      "Quer: Luxilon 4G 1.25",
    ],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Touch & Gefühl", "Allround", "Komfort"],
    instruction:
      "Hybrid aus Naturdarm und Polyester für elegantes, gefühlvolles Allround-Spiel mit viel Touch.",
    price: 59,
  },
  {
    id: "federer",
    pro: "Roger Federer",
    tag: "Legende",
    brand: "Wilson",
    img: "/beratung/pros/federer.jpg",
    accent: "from-neutral-700 to-black",
    strings: [
      "Längs: Wilson Natural Gut 1.30",
      "Quer: Luxilon ALU Power Rough 1.25",
    ],
    tension: "ca. 26,5 kg / 58,5 lbs",
    traits: ["Touch & Gefühl", "Komfort", "Präzision"],
    instruction:
      "Premium-Hybrid aus Naturdarm und Polyester — weiches, kontrolliertes Spielgefühl mit viel Touch am Netz.",
    price: 59,
  },
];

export default function BespannungConfigurator() {
  const [selected, setSelected] = useState<Setup | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  function initials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("");
  }

  if (ordered && selected) {
    return (
      <Card className="text-center">
        <Check />
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
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Spiele wie die Profis
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Wähle das Setup deines Lieblingsspielers — wir zeigen dir die exakte
        Saite &amp; Spannung und besaiten deinen Schläger genau so.
      </p>

      {/* Spieler-Auswahl */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {SETUPS.map((s) => {
          const active = selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelected(s);
                setRequestOpen(false);
              }}
              className={`group relative overflow-hidden rounded-2xl ring-2 transition-all ${
                active ? "ring-matchup" : "ring-transparent hover:ring-neutral-300"
              }`}
            >
              <div className="relative aspect-[3/4]">
                {s.img ? (
                  <Image
                    src={s.img}
                    alt={s.pro}
                    fill
                    sizes="(max-width: 768px) 33vw, 160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${s.accent}`}
                  >
                    <span className="text-2xl font-bold tracking-tight text-white/90">
                      {initials(s.pro)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                  {s.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                  <div className="text-[11px] font-bold leading-tight text-white sm:text-xs">
                    {s.pro}
                  </div>
                  <div className="text-[10px] text-white/70">{s.brand}</div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Eigenes Setup */}
        <button
          type="button"
          onClick={() => {
            setRequestOpen(true);
            setSelected(null);
          }}
          className={`flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-2 text-center transition-colors ${
            requestOpen
              ? "border-matchup bg-matchup/5"
              : "border-neutral-300 hover:border-black"
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg text-white">
            +
          </span>
          <span className="text-[11px] font-semibold leading-tight text-neutral-700">
            Eigenes Setup anfragen
          </span>
        </button>
      </div>

      {/* Setup-Detail */}
      {selected && (
        <div className="mt-7 rounded-2xl bg-neutral-50 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-matchup">
            Dein perfektes Setup
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{selected.pro}</h3>

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
                inkl. Premium-Saite &amp; Bespannung
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
      )}

      {/* Anfrageformular eigenes Setup */}
      {requestOpen && <RequestForm onClose={() => setRequestOpen(false)} />}

      {!selected && !requestOpen && (
        <p className="mt-7 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          Wähle oben einen Spieler, um Saite, Spannung und Details zu sehen — oder
          frage dein eigenes Setup an.
        </p>
      )}
    </Card>
  );
}

/* ── Anfrageformular ───────────────────────────────────────────────────── */

function RequestForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", wish: "", note: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.wish.trim()) {
      setError("Bitte Name, E-Mail und dein Wunsch-Setup ausfüllen.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mt-7 rounded-2xl bg-neutral-50 p-8 text-center">
        <Check />
        <h3 className="mt-5 text-xl font-bold tracking-tight">
          Anfrage gesendet, {form.name.split(" ")[0]}!
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
          Wir melden uns mit einer Empfehlung zu deinem Wunsch-Setup
          „{form.wish}" und einem passenden Angebot.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-7 rounded-2xl bg-neutral-50 p-6">
      <h3 className="text-xl font-bold tracking-tight">Eigenes Setup anfragen</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Anderer Lieblingsspieler oder eigene Vorstellung? Sag uns, was du
        spielst — wir finden dein Setup.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <Field label="E-Mail *" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
      </div>
      <div className="mt-4">
        <Field
          label="Wunsch-Setup / Spieler *"
          placeholder="z. B. wie Rafael Nadal, oder: viel Spin & armschonend"
          value={form.wish}
          onChange={(v) => setForm((f) => ({ ...f, wish: v }))}
        />
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
          Anmerkung (optional)
        </label>
        <textarea
          rows={3}
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full resize-none rounded-lg border border-neutral-300 p-3.5 text-sm outline-none transition-colors focus:border-black"
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-full border border-neutral-300 px-6 text-sm font-medium transition-colors hover:bg-neutral-100"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="h-11 rounded-full bg-matchup px-8 text-sm font-bold text-white transition-colors hover:bg-matchup-hover"
        >
          Anfrage senden
        </button>
      </div>
    </form>
  );
}

/* ── Bausteine ─────────────────────────────────────────────────────────── */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Check() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">
      ✓
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-28 shrink-0 text-neutral-500">{label}</span>
      <span className="font-medium text-black">{children}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-neutral-300 px-3.5 text-sm outline-none transition-colors focus:border-black"
      />
    </label>
  );
}
