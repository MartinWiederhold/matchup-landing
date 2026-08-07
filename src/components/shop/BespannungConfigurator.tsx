"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { TFunction } from "@/lib/i18n";

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
    // 2025 von RPM Blast auf RPM Team gewechselt (weicher, ellbogenfreundlicher) —
    // konsistent mit /shop/setup/alcaraz. Quelle: alcaraz-setup.md.
    strings: ["Babolat RPM Team 1.30 (Längs & Quer)"],
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
    img: "/beratung/pros/fritz.jpg",
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
    img: "/beratung/pros/ruud.jpg",
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
    img: "/beratung/pros/tsitsipas.jpg",
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
    img: "/beratung/pros/dimitrov.jpg",
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

const WTA_SETUPS: Setup[] = [
  {
    id: "sabalenka",
    pro: "Aryna Sabalenka",
    tag: "WTA #1",
    brand: "Wilson",
    accent: "from-amber-400 to-red-500",
    strings: ["Luxilon 4G 1.30 (Längs & Quer)"],
    tension: "ca. 26 kg / 57 lbs",
    traits: ["Maximale Power", "Aufschlag", "Haltbarkeit"],
    instruction:
      "Steifes Polyester bei hoher Spannung für kompromisslose Power und flache, harte Schläge. Für kräftiges, offensives Spiel.",
    price: 45,
  },
  {
    id: "swiatek",
    pro: "Iga Świątek",
    tag: "WTA Top 5",
    brand: "Tecnifibre",
    accent: "from-rose-400 to-red-600",
    strings: ["Tecnifibre Razor Soft 1.20 (Längs & Quer)"],
    tension: "ca. 26,5 kg / 58 lbs",
    traits: ["Extremer Spin", "Kontrolle", "Topspin"],
    instruction:
      "Dünnes, kantiges Polyester für massiven Topspin und Kontrolle bei hoher Spannung. Für drehungsreiches, aktives Grundlinienspiel.",
    price: 45,
  },
  {
    id: "gauff",
    pro: "Coco Gauff",
    tag: "WTA Top 5",
    brand: "Head",
    accent: "from-sky-400 to-blue-600",
    strings: ["Head Lynx Tour 1.25 (Längs & Quer)"],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Spin", "Tempo", "Allround"],
    instruction:
      "Glattes Polyester für eine Mischung aus Spin und Speed — vielseitig für schnelles, athletisches Allcourt-Spiel.",
    price: 45,
  },
  {
    id: "rybakina",
    pro: "Elena Rybakina",
    tag: "WTA Top 10",
    brand: "Yonex",
    accent: "from-cyan-400 to-teal-600",
    strings: ["Yonex Poly Tour Pro 1.25 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Aufschlag", "Power", "Flaches Spiel"],
    instruction:
      "Komfortables Polyester mit gutem Ballspeed — ideal für druckvolle Aufschläge und flache, harte Grundschläge.",
    price: 45,
  },
  {
    id: "pegula",
    pro: "Jessica Pegula",
    tag: "WTA Top 10",
    brand: "Yonex",
    accent: "from-indigo-400 to-blue-600",
    strings: ["Yonex Poly Tour Strike 1.25 (Längs & Quer)"],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Kontrolle", "Präzision", "Frühes Spiel"],
    instruction:
      "Kontrolliertes Polyester für früh genommene, präzise Bälle. Für taktisch sauberes Grundlinienspiel.",
    price: 45,
  },
  {
    id: "zheng",
    pro: "Qinwen Zheng",
    tag: "WTA Top 10",
    brand: "Wilson",
    accent: "from-fuchsia-400 to-purple-600",
    strings: ["Luxilon ALU Power 1.25 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Power", "Aufschlag", "Spin"],
    instruction:
      "Tour-Klassiker aus Polyester für die Balance aus Power und Spin. Für kraftvolles, offensives Spiel.",
    price: 45,
  },
  {
    id: "paolini",
    pro: "Jasmine Paolini",
    tag: "WTA Top 10",
    brand: "Head",
    accent: "from-emerald-400 to-green-600",
    strings: ["Head Hawk Touch 1.25 (Längs & Quer)"],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Spin", "Speed", "Komfort"],
    instruction:
      "Weiches Polyester für Spin und Tempo bei gutem Komfort — passend für schnelles, bewegliches Spiel.",
    price: 45,
  },
  {
    id: "keys",
    pro: "Madison Keys",
    tag: "WTA Top 10",
    brand: "Wilson",
    accent: "from-orange-400 to-amber-600",
    strings: ["Luxilon 4G Soft 1.25 (Längs & Quer)"],
    tension: "ca. 25,5 kg / 56 lbs",
    traits: ["Maximale Power", "Aufschlag", "Flaches Spiel"],
    instruction:
      "Halbweiches Polyester für enorme Power bei stabiler Kontrolle. Für aggressives, hart schlagendes Spiel.",
    price: 45,
  },
  {
    id: "krejcikova",
    pro: "Barbora Krejčíková",
    tag: "Grand-Slam-Siegerin",
    brand: "Wilson",
    accent: "from-violet-400 to-purple-600",
    strings: [
      "Längs: Wilson Natural Gut 1.30",
      "Quer: Luxilon ALU Power 1.25",
    ],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Touch & Gefühl", "Allround", "Variation"],
    instruction:
      "Hybrid aus Naturdarm und Polyester für gefühlvolles, variantenreiches Spiel mit viel Touch.",
    price: 59,
  },
  {
    id: "ostapenko",
    pro: "Jeļena Ostapenko",
    tag: "Grand-Slam-Siegerin",
    brand: "Wilson",
    accent: "from-red-400 to-rose-600",
    strings: ["Luxilon ALU Power 1.25 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Maximale Power", "Flaches Spiel", "Tempo"],
    instruction:
      "Kontrolliertes Polyester für extrem flaches, frühes und kraftvolles Spiel. Für kompromisslose Offensive.",
    price: 45,
  },
  {
    id: "jabeur",
    pro: "Ons Jabeur",
    tag: "WTA Top 15",
    brand: "Wilson",
    accent: "from-teal-400 to-emerald-600",
    strings: [
      "Längs: Wilson Natural Gut 1.30",
      "Quer: Luxilon 4G 1.25",
    ],
    tension: "ca. 24 kg / 53 lbs",
    traits: ["Touch & Gefühl", "Variation", "Stop & Slice"],
    instruction:
      "Naturdarm-Hybrid für maximales Gefühl und Variation — perfekt für kreatives Spiel mit Stops, Slice und Winkeln.",
    price: 59,
  },
  {
    id: "collins",
    pro: "Danielle Collins",
    tag: "WTA Top 15",
    brand: "Yonex",
    accent: "from-pink-400 to-rose-600",
    strings: ["Yonex Poly Tour Pro 1.25 (Längs & Quer)"],
    tension: "ca. 25 kg / 55 lbs",
    traits: ["Power", "Flaches Spiel", "Aggressiv"],
    instruction:
      "Polyester mit gutem Ballspeed für flaches, aggressives Spiel von der Grundlinie. Für offensive Spielerinnen.",
    price: 45,
  },
];

// Übersetzungs-Maps für Eigenschaften (traits) & Spielanweisungen (instruction).
// Spieler-, Saiten- und Produktnamen bleiben unübersetzt.
const TRAIT_KEY: Record<string, string> = {
  Aggressiv: "beratung.traitAggressive",
  Allround: "beratung.traitAllround",
  Armschonend: "beratung.traitArmFriendly",
  Aufschlag: "beratung.traitServe",
  "Einhand-Rückhand": "beratung.traitOneHandedBackhand",
  "Extremer Spin": "beratung.traitExtremeSpin",
  "Flaches Spiel": "beratung.traitFlatGame",
  "Frühes Spiel": "beratung.traitEarlyGame",
  Haltbarkeit: "beratung.traitDurability",
  Komfort: "beratung.traitComfort",
  Kontrolle: "beratung.traitControl",
  "Maximale Power": "beratung.traitMaxPower",
  "Maximaler Spin": "beratung.traitMaxSpin",
  Power: "beratung.traitPower",
  "Präzision": "beratung.traitPrecision",
  Sandplatz: "beratung.traitClay",
  Speed: "beratung.traitSpeed",
  Spin: "beratung.traitSpin",
  "Stop & Slice": "beratung.traitStopSlice",
  Tempo: "beratung.traitPace",
  Topspin: "beratung.traitTopspin",
  "Touch & Gefühl": "beratung.traitTouchFeel",
  Touch: "beratung.traitTouch",
  Variation: "beratung.traitVariation",
};

function trait(t: TFunction, value: string): string {
  const key = TRAIT_KEY[value];
  return key ? t(key) : value;
}

function instruction(t: TFunction, id: string): string {
  return t(`beratung.instr_${id}`);
}

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
  const t = useT();
  const [selected, setSelected] = useState<Setup | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [tour, setTour] = useState<"atp" | "wta">("atp");
  const players = tour === "atp" ? SETUPS : WTA_SETUPS;

  if (ordered && selected) {
    return (
      <Card className="text-center">
        <Check />
        <h3 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900">
          {t("beratung.orderCreated")}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
          {t("beratung.orderConfirmPre")}
          <strong className="text-neutral-900">{selected.pro}</strong>
          {t("beratung.orderConfirmPost")}
          <br />
          {selected.strings.join(" · ")} — {selected.tension}.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
          {t("beratung.orderShip")}
        </p>
        <button
          type="button"
          onClick={() => {
            setOrdered(false);
            setSelected(null);
          }}
          className="mt-8 h-12 rounded-full bg-black px-8 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
        >
          {t("beratung.chooseAnother")}
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="relative">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {t("beratung.stringingTitle")}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
          {t("beratung.stringingSubtitle")}
        </p>

        {/* Herren / Damen Umschalter */}
        <div className="mt-5 inline-flex rounded-full bg-neutral-100 p-1">
          {([
            { v: "atp", label: t("beratung.tourAtp") },
            { v: "wta", label: t("beratung.tourWta") },
          ] as const).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => {
                setTour(o.v);
                setSelected(null);
                setRequestOpen(false);
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                tour === o.v ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
          {/* LINKS: Spieler in Kreisen */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-6 lg:grid-cols-3">
            {players.map((s) => {
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
                    className={`relative h-[64px] w-[64px] rounded-full p-[2px] transition-all sm:h-[72px] sm:w-[72px] ${
                      active
                        ? "bg-black"
                        : "bg-neutral-200 group-hover:bg-neutral-300"
                    }`}
                  >
                    <span className="block h-full w-full overflow-hidden rounded-full bg-white">
                      {s.img ? (
                        <Image
                          src={s.img}
                          alt={s.pro}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm font-bold text-neutral-500">
                          {initials(s.pro)}
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className={`mt-2 text-center text-[11px] font-medium leading-tight ${
                      active ? "text-neutral-900" : "text-neutral-500"
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
                    ? "border-black text-black"
                    : "border-neutral-300 text-neutral-400 group-hover:border-neutral-500 group-hover:text-neutral-700"
                }`}
              >
                +
              </span>
              <span
                className={`mt-2 text-center text-[11px] font-medium leading-tight ${
                  requestOpen ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {t("beratung.own")}
              </span>
            </button>
          </div>

          {/* RECHTS: Setup-Detail / Anfrage / Platzhalter */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selected ? (
              <SetupDetail setup={selected} onOrder={() => setOrdered(true)} t={t} />
            ) : requestOpen ? (
              <RequestForm onClose={() => setRequestOpen(false)} t={t} />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xl text-neutral-400">
                  ⌖
                </span>
                <p className="mt-4 max-w-xs text-sm text-neutral-500">
                  {t("beratung.placeholderHint")}
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

function SetupDetail({
  setup,
  onOrder,
  t,
}: {
  setup: Setup;
  onOrder: () => void;
  t: TFunction;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
      <div className="flex items-center gap-4">
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-300">
          {setup.img ? (
            <Image src={setup.img} alt={setup.pro} fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-base font-bold text-neutral-500">
              {initials(setup.pro)}
            </span>
          )}
        </span>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {t("beratung.yourSetup")}
          </div>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-neutral-900">
            {setup.pro}
          </h3>
          <div className="text-xs text-neutral-500">
            {setup.tag} · {setup.brand}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Row label={t("beratung.rowString")}>
          <div className="space-y-0.5">
            {setup.strings.map((str) => (
              <div key={str}>{str}</div>
            ))}
          </div>
        </Row>
        <Row label={t("beratung.rowTension")}>{setup.tension}</Row>
        <Row label={t("beratung.rowBrand")}>{setup.brand}</Row>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {setup.traits.map((tr) => (
          <span
            key={tr}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
          >
            {trait(t, tr)}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
        {instruction(t, setup.id)}
      </p>

      {/* Nur Alcaraz: Verweis auf die komplette Setup-Seite im Shop */}
      {setup.id === "alcaraz" && (
        <Link
          href="/shop/setup/alcaraz"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 ring-1 ring-neutral-200 transition-colors hover:bg-neutral-100"
        >
          <span>{t("beratung.alcarazShopCta")}</span>
          <span aria-hidden className="text-neutral-400">→</span>
        </Link>
      )}

      <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-5 sm:flex-row">
        <div className="text-center sm:text-left">
          <div className="text-2xl font-bold tracking-tight text-neutral-900">
            {setup.price} €
          </div>
          <div className="text-xs text-neutral-500">
            {t("beratung.priceIncludes")}
          </div>
        </div>
        <button
          type="button"
          onClick={onOrder}
          className="w-full rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 sm:w-auto"
        >
          {t("beratung.orderWithSetup")}
        </button>
      </div>
    </div>
  );
}

/* ── Anfrageformular eigenes Setup ─────────────────────────────────────── */

function RequestForm({ onClose, t }: { onClose: () => void; t: TFunction }) {
  const [form, setForm] = useState({ name: "", email: "", wish: "", note: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.wish.trim()) {
      setError(t("beratung.reqError"));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <Check />
        <h3 className="mt-5 text-xl font-bold tracking-tight text-neutral-900">
          {t("beratung.reqSent", { name: form.name.split(" ")[0] })}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
          {t("beratung.reqSentText", { wish: form.wish })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
      <h3 className="text-xl font-bold tracking-tight text-neutral-900">
        {t("beratung.reqTitle")}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">
        {t("beratung.reqSubtitle")}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={t("beratung.reqName")} value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <Field label={t("beratung.reqEmail")} type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
      </div>
      <div className="mt-4">
        <Field
          label={t("beratung.reqWish")}
          placeholder={t("beratung.reqWishPlaceholder")}
          value={form.wish}
          onChange={(v) => setForm((f) => ({ ...f, wish: v }))}
        />
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
          {t("beratung.reqNote")}
        </label>
        <textarea
          rows={3}
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full resize-none rounded-lg border border-neutral-300 bg-white p-3.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
        />
      </div>
      {error && <p className="mt-3 text-sm text-neutral-700">{error}</p>}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-full border border-neutral-300 px-6 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          {t("beratung.reqCancel")}
        </button>
        <button
          type="submit"
          className="h-11 rounded-full bg-black px-8 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
        >
          {t("beratung.reqSend")}
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
      className={`rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 ${className}`}
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
      <span className="font-medium text-neutral-900">{children}</span>
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
        className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
      />
    </label>
  );
}
