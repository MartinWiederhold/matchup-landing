"use client";

/**
 * EIGENSTÄNDIGER DESIGN-SHOWCASE — /webappexample
 *
 * Reines Mockup, wie die Webapp ("Entdecke"-Tab) in einem neuen Farbschema
 * aussehen könnte. Hat NICHTS mit der echten Webapp zu tun: keine Auth, kein
 * Supabase, keine echten Daten. Die echte App unter /app bleibt unberührt.
 *
 * Farbwelt = Mix der Moodboards: warmes Creme/Sand & Walnuss/Cognac (Editorial),
 * tiefes Espresso-Schwarz mit Padel-Neon-Blau (Nightlife) und ein Hauch Grün.
 */

import { useState } from "react";

type Profile = {
  name: string;
  age: number;
  img: string;
  city: string;
  km: number;
  match: number;
  tags: { label: string; tone: "cognac" | "green" | "ink" }[];
};

const FEATURED: Profile = {
  name: "Mara",
  age: 27,
  img: "/webappexample/p1.jpg",
  city: "Zürich",
  km: 2,
  match: 96,
  tags: [
    { label: "Tennis", tone: "cognac" },
    { label: "Level 5", tone: "ink" },
  ],
};

const GRID: Profile[] = [
  {
    name: "Lia",
    age: 24,
    img: "/webappexample/p2.jpg",
    city: "Winterthur",
    km: 6,
    match: 91,
    tags: [{ label: "Padel", tone: "green" }],
  },
  {
    name: "Jonas",
    age: 31,
    img: "/padel/padel-1.jpg",
    city: "Zürich",
    km: 4,
    match: 88,
    tags: [{ label: "Padel", tone: "green" }],
  },
  {
    name: "Sofia",
    age: 29,
    img: "/tennis/tennis-2.jpg",
    city: "Zug",
    km: 9,
    match: 84,
    tags: [{ label: "Tennis", tone: "cognac" }],
  },
  {
    name: "Elena",
    age: 26,
    img: "/tennis/tennis-3.jpg",
    city: "Luzern",
    km: 12,
    match: 82,
    tags: [{ label: "Tennis", tone: "cognac" }],
  },
  {
    name: "Noah",
    age: 28,
    img: "/pickleball/pickleball-1.jpg",
    city: "Basel",
    km: 14,
    match: 79,
    tags: [{ label: "Pickleball", tone: "ink" }],
  },
  {
    name: "Vale",
    age: 25,
    img: "/padel/padel-2.jpg",
    city: "Bern",
    km: 18,
    match: 77,
    tags: [{ label: "Padel", tone: "green" }],
  },
];

const TAG_TONE: Record<string, string> = {
  cognac: "bg-[#A9663B]/90 text-[#FBF3E7]",
  green: "bg-[#3F5A48]/90 text-[#EAF1E9]",
  ink: "bg-[#1B140E]/85 text-[#F3E8D8]",
};

function ConnectIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8.5 12h7M12 8.5v7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const TABS = [
  { key: "entdecken", label: "Entdecken", icon: discoverIcon },
  { key: "likes", label: "Likes", icon: heartIcon },
  { key: "matches", label: "Matches", icon: chatIcon },
  { key: "spiele", label: "Spiele", icon: ballIcon },
  { key: "profil", label: "Profil", icon: userIcon },
] as const;

function MatchPill({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[#11161F]/80 px-2.5 py-1 text-[11px] font-bold text-[#EAF3FB] ring-1 ring-[#4FB0F2]/40 backdrop-blur-md">
      <span className="h-1.5 w-1.5 rounded-full bg-[#4FB0F2] shadow-[0_0_8px_rgba(79,176,242,0.9)]" />
      {value}% Match
    </div>
  );
}

function FeaturedCard({ p }: { p: Profile }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-24px_rgba(43,33,25,0.55)] ring-1 ring-[#2B2119]/10">
      <div className="relative aspect-[4/5] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.img} alt={p.name} className="h-full w-full object-cover object-[center_25%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B140E]/85 via-[#1B140E]/10 to-transparent" />

        <div className="absolute left-4 top-4">
          <MatchPill value={p.match} />
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
          <div className="text-[#FBF3E7]">
            <div className="flex items-center gap-2">
              {p.tags.map((t) => (
                <span
                  key={t.label}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${TAG_TONE[t.tone]}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <h3 className="mt-2.5 font-serif text-3xl font-medium leading-none">
              {p.name}, {p.age}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#FBF3E7]/75">
              {p.city} · {p.km} km entfernt
            </p>
          </div>

          <button
            type="button"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#A9663B] text-[#FBF3E7] shadow-[0_10px_24px_-6px_rgba(169,102,59,0.8)] ring-1 ring-[#FBF3E7]/20 transition-transform active:scale-95"
            aria-label={`Mit ${p.name} verbinden`}
          >
            <ConnectIcon className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GridCard({ p }: { p: Profile }) {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-[#2B2119]/10 shadow-[0_14px_30px_-18px_rgba(43,33,25,0.5)]">
      <div className="relative aspect-[3/4] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B140E]/80 via-transparent to-transparent" />

        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TAG_TONE[p.tags[0].tone]}`}
        >
          {p.tags[0].label}
        </span>

        <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between">
          <div className="text-[#FBF3E7]">
            <p className="font-serif text-lg font-medium leading-none">
              {p.name}, {p.age}
            </p>
            <p className="mt-1 text-[11px] text-[#FBF3E7]/70">{p.km} km</p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF3E7]/95 text-[#A9663B] shadow-md transition-transform active:scale-95"
            aria-label={`Mit ${p.name} verbinden`}
          >
            <ConnectIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const CHIPS = ["In der Nähe", "Tennis", "Padel", "Level 4–6", "Heute aktiv"];

export default function WebAppExamplePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("entdecken");
  const [activeChip, setActiveChip] = useState("In der Nähe");

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#15100B] py-0 sm:py-8">
      {/* Phone-Frame */}
      <div className="relative flex min-h-screen w-full max-w-[440px] flex-col overflow-hidden bg-gradient-to-b from-[#F3EADB] via-[#EFE4D2] to-[#E8DAC4] shadow-2xl sm:min-h-[900px] sm:rounded-[2.75rem] sm:ring-1 sm:ring-black/30">
        {/* Header */}
        <header className="px-5 pb-3 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A9663B]">
                Zürich, CH
              </p>
              <h1 className="font-serif text-[2rem] font-medium leading-none text-[#2B2119]">
                Entdecken
              </h1>
            </div>
            <div className="relative">
              <span className="absolute inset-0 rounded-full ring-2 ring-[#4FB0F2] shadow-[0_0_12px_rgba(79,176,242,0.6)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/webappexample/p2.jpg"
                alt="Dein Profil"
                className="h-11 w-11 rounded-full object-cover"
              />
            </div>
          </div>

          {/* Filter-Chips */}
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CHIPS.map((c) => {
              const on = c === activeChip;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveChip(c)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    on
                      ? "bg-[#2B2119] text-[#F3EADB]"
                      : "bg-[#2B2119]/[0.06] text-[#5C4B3A] ring-1 ring-[#2B2119]/10"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </header>

        {/* Inhalt */}
        <main className="flex-1 overflow-y-auto px-5 pb-28">
          {tab === "entdecken" ? (
            <>
              <FeaturedCard p={FEATURED} />

              <div className="mb-3 mt-7 flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-[#2B2119]">
                  In deiner Nähe
                </h2>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#3F5A48]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3F5A48]" />
                  148 aktiv
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {GRID.map((p) => (
                  <GridCard key={p.name} p={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2B2119]/[0.06] text-[#A9663B]">
                <TabGlyph which={tab} className="h-8 w-8" />
              </div>
              <p className="mt-4 font-serif text-2xl text-[#2B2119]">
                {TABS.find((t) => t.key === tab)?.label}
              </p>
              <p className="mt-1 text-sm text-[#5C4B3A]/80">Vorschau — Design-Demo</p>
            </div>
          )}
        </main>

        {/* Tab-Bar */}
        <nav className="absolute inset-x-0 bottom-0 z-10 border-t border-[#F3E8D8]/10 bg-[#1B140E]/95 px-3 pb-6 pt-2.5 backdrop-blur-xl sm:rounded-b-[2.75rem]">
          <div className="flex items-center justify-between">
            {TABS.map((t) => {
              const on = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className="relative flex flex-1 flex-col items-center gap-1 py-1"
                >
                  <span
                    className={`transition-colors ${
                      on
                        ? "text-[#4FB0F2] [filter:drop-shadow(0_0_8px_rgba(79,176,242,0.85))]"
                        : "text-[#F3E8D8]/45"
                    }`}
                  >
                    <t.icon className="h-6 w-6" />
                  </span>
                  <span
                    className={`text-[10px] font-semibold tracking-wide ${
                      on ? "text-[#F3E8D8]" : "text-[#F3E8D8]/40"
                    }`}
                  >
                    {t.label}
                  </span>
                  {on && (
                    <span className="absolute -top-0.5 h-1 w-1 rounded-full bg-[#4FB0F2] shadow-[0_0_8px_rgba(79,176,242,0.9)]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ---- Icons ---- */
function discoverIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M15.5 8.5l-2 5-5 2 2-5 5-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}
function heartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 20s-7-4.4-9.2-8.7A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9.2 5.3C19 15.6 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function chatIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ballIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.6 5.6a11 11 0 0 1 0 12.8M18.4 5.6a11 11 0 0 0 0 12.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function userIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19.5a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TabGlyph({ which, className }: { which: string; className?: string }) {
  if (which === "likes") return heartIcon({ className });
  if (which === "matches") return chatIcon({ className });
  if (which === "spiele") return ballIcon({ className });
  return userIcon({ className });
}
