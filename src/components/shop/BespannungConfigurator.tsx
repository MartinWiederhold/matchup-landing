"use client";

import { useState } from "react";
import Image from "next/image";

/* ──────────────────────────────────────────────────────────────────────────
   Bespannungs-Konfigurator
   - Spieler links in Kreisen wählen → Setup erscheint rechts → bestellen
   - oder eigenes Setup per Anfrageformular
   - Black/Lila Premium-Design (Webapp-Look)
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
    img: "/beratung/pros/sinner.jpg",
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
    img: "/beratung/pros/djokovic.jpg",
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
    img: "/beratung/pros/medvedev.jpg",
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
    img: "/beratung/pros/rublev.jpg",
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
    strings: ["Längs: Wilson Natural Gut 1.30", "Quer: Luxilon 4G 1.25"],
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

function lastName(name: string) {
  return name.split(" ").slice(-1)[0];
}
function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export default function BespannungConfigurator() {
  const [selected, setSelected] = useState<Setup | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  if (ordered && selected) {
    return (
      <Card className="text-center">
        <Check />
        <h3 className="mt-6 text-2xl font-bold tracking-tight text-white">
          Besaitungs-Auftrag erstellt
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
          Dein Schläger wird im <strong className="text-white">{selected.pro}</strong>-Setup
          besaitet:
          <br />
          {selected.strings.join(" · ")} — {selected.tension}.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50">
          Schick uns deinen Schläger ein — wir besaiten ihn exakt nach diesen
          Settings und schicken ihn spielfertig zurück.
        </p>
        <button
          type="button"
          onClick={() => {
            setOrdered(false);
            setSelected(null);
          }}
          className="mt-8 h-12 rounded-full bg-white px-8 text-sm font-bold text-black transition-colors hover:bg-white/85"
        >
          Weiteres Setup wählen
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="relative">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Spiele wie die Profis
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
          Wähle das Setup deines Lieblingsspielers — wir zeigen dir die exakte
          Saite &amp; Spannung und besaiten deinen Schläger genau so.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
          {/* LINKS: Spieler in Kreisen */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-6 lg:grid-cols-3">
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
                  className="group flex flex-col items-center"
                >
                  <span
                    className={`relative h-[64px] w-[64px] rounded-full p-[2.5px] transition-all sm:h-[72px] sm:w-[72px] ${
                      active
                        ? "bg-gradient-to-br from-violet-500 to-matchup shadow-[0_0_22px_-2px_rgba(124,58,237,0.7)]"
                        : "bg-white/10 group-hover:bg-white/25"
                    }`}
                  >
                    <span className="block h-full w-full overflow-hidden rounded-full bg-neutral-900">
                      {s.img ? (
                        <Image
                          src={s.img}
                          alt={s.pro}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span
                          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${s.accent} text-sm font-bold text-white/90`}
                        >
                          {initials(s.pro)}
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className={`mt-2 text-center text-[11px] font-medium leading-tight ${
                      active ? "text-white" : "text-white/55"
                    }`}
                  >
                    {lastName(s.pro)}
                  </span>
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
              className="group flex flex-col items-center"
            >
              <span
                className={`flex h-[64px] w-[64px] items-center justify-center rounded-full border-2 border-dashed text-xl transition-colors sm:h-[72px] sm:w-[72px] ${
                  requestOpen
                    ? "border-matchup text-matchup"
                    : "border-white/25 text-white/50 group-hover:border-white/60 group-hover:text-white"
                }`}
              >
                +
              </span>
              <span
                className={`mt-2 text-center text-[11px] font-medium leading-tight ${
                  requestOpen ? "text-white" : "text-white/55"
                }`}
              >
                Eigenes
              </span>
            </button>
          </div>

          {/* RECHTS: Setup-Detail / Anfrage / Platzhalter */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selected ? (
              <SetupDetail setup={selected} onOrder={() => setOrdered(true)} />
            ) : requestOpen ? (
              <RequestForm onClose={() => setRequestOpen(false)} />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl text-white/40">
                  ⌖
                </span>
                <p className="mt-4 max-w-xs text-sm text-white/50">
                  Tippe links auf einen Spieler — Saite, Spannung und Details
                  erscheinen sofort hier.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Setup-Detail (rechts) ─────────────────────────────────────────────── */

function SetupDetail({ setup, onOrder }: { setup: Setup; onOrder: () => void }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-7">
      <div className="flex items-center gap-4">
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-violet-500/60">
          {setup.img ? (
            <Image src={setup.img} alt={setup.pro} fill sizes="64px" className="object-cover" />
          ) : (
            <span
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${setup.accent} text-base font-bold text-white`}
            >
              {initials(setup.pro)}
            </span>
          )}
        </span>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-300">
            Dein perfektes Setup
          </div>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-white">
            {setup.pro}
          </h3>
          <div className="text-xs text-white/50">
            {setup.tag} · {setup.brand}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Row label="Saite">
          <div className="space-y-0.5">
            {setup.strings.map((str) => (
              <div key={str}>{str}</div>
            ))}
          </div>
        </Row>
        <Row label="Spannung">{setup.tension}</Row>
        <Row label="Schläger-Marke">{setup.brand}</Row>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {setup.traits.map((t) => (
          <span
            key={t}
            className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200 ring-1 ring-violet-400/25"
          >
            {t}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/60">
        {setup.instruction}
      </p>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
        <div className="text-center sm:text-left">
          <div className="text-2xl font-bold tracking-tight text-white">
            {setup.price} €
          </div>
          <div className="text-xs text-white/45">
            inkl. Premium-Saite &amp; Bespannung
          </div>
        </div>
        <button
          type="button"
          onClick={onOrder}
          className="w-full rounded-full bg-gradient-to-r from-violet-500 to-matchup px-8 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Mit diesem Setup bestellen →
        </button>
      </div>
    </div>
  );
}

/* ── Anfrageformular eigenes Setup ─────────────────────────────────────── */

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
      <div className="rounded-2xl bg-white/[0.04] p-8 text-center ring-1 ring-white/10">
        <Check />
        <h3 className="mt-5 text-xl font-bold tracking-tight text-white">
          Anfrage gesendet, {form.name.split(" ")[0]}!
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          Wir melden uns mit einer Empfehlung zu deinem Wunsch-Setup
          „{form.wish}" und einem passenden Angebot.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-7">
      <h3 className="text-xl font-bold tracking-tight text-white">
        Eigenes Setup anfragen
      </h3>
      <p className="mt-1 text-sm text-white/55">
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
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-white/45">
          Anmerkung (optional)
        </label>
        <textarea
          rows={3}
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full resize-none rounded-lg border border-white/15 bg-white/5 p-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-400"
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-full border border-white/20 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="h-11 rounded-full bg-gradient-to-r from-violet-500 to-matchup px-8 text-sm font-bold text-white transition-opacity hover:opacity-90"
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
      className={`relative overflow-hidden rounded-3xl bg-neutral-950 p-6 ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8 ${className}`}
    >
      {/* dezenter Lila-Schein */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-matchup/20 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Check() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-matchup text-2xl text-white">
      ✓
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-28 shrink-0 text-white/45">{label}</span>
      <span className="font-medium text-white">{children}</span>
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-white/45">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-400"
      />
    </label>
  );
}
