"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

function Icon({ path, size = 22 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

// Beispiel-Profil (wie im mockup2, aber eigenständig für die weisse Variante)
const PERSON = {
  name: "Elena",
  age: 27,
  city: "Zürich",
  level: "Fortgeschritten",
  sports: ["Tennis", "Padel"],
  score: 1180,
  matches: 38,
  winrate: "58 %",
  height: 172,
  bio: "Spiele seit 12 Jahren Tennis, seit einem Jahr auch Padel. Suche regelmässige Partner für Feierabend-Matches – am liebsten dienstags oder donnerstags.",
  img: "https://i.pravatar.cc/600?img=24",
  gallery: [
    "https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=70",
    "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=70",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=70",
    "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=600&q=70",
  ],
};

export default function Mockup2DetailWhite() {
  const [connected, setConnected] = useState(false);
  const p = PERSON;
  const rows: { label: string; value: string }[] = [
    { label: "Username", value: `@${p.name.toLowerCase()}` },
    { label: "Alter", value: `${p.age}` },
    { label: "Grösse", value: `${p.height} cm` },
    { label: "Level", value: p.level },
    { label: "Sportarten", value: p.sports.join(", ") },
    { label: "Stadt", value: p.city },
    { label: "Matchscore", value: `${p.score}` },
    { label: "Bilanz", value: `${p.matches} Spiele · ${p.winrate}` },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col overflow-hidden bg-white text-neutral-900">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-4 text-neutral-900">
          <Icon path="M12 5v14M5 12h14" size={26} />
          <Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={24} />
        </div>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-neutral-700">
          <Icon path="M6 6l12 12M18 6L6 18" size={18} />
        </button>
      </div>
      <h1 className="px-5 pt-5 text-[46px] font-extrabold leading-[0.92] tracking-tight text-black/[0.08]">Select<br />Profile</h1>

      {/* Profil-Karte (auf weissem Hintergrund → mit Rahmen abgesetzt), scrollbar für Galerie */}
      <div className="mt-auto max-h-[82vh] overflow-hidden p-3.5">
        <div className="max-h-[calc(82vh-28px)] overflow-y-auto rounded-[26px] border border-black/[0.08] bg-white p-5 pb-4 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          {/* Kopf: Vorname links, Profilbild oben rechts im Kreis */}
          <div className="flex items-start justify-between">
            <h2 className="text-[42px] font-extrabold leading-none tracking-tight text-neutral-900">{p.name}</h2>
            <img src={p.img} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          </div>

          <div className="mt-5 space-y-3">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[15px] text-neutral-500">{r.label}</span>
                <span className="text-[15px] font-semibold text-neutral-900">{r.value}</span>
              </div>
            ))}
          </div>

          {p.bio && <p className="mt-4 text-[13.5px] leading-relaxed text-neutral-500">{p.bio}</p>}

          <div className="mt-4 flex gap-2.5">
            <button type="button" onClick={() => setConnected(true)} className={`flex-1 rounded-full py-3.5 text-[15px] font-bold ${connected ? "bg-emerald-500/10 text-emerald-600" : "bg-neutral-900 text-white"}`}>
              {connected ? "Angefragt ✓" : "Verbinden"}
            </button>
            <button type="button" className="flex-1 rounded-full border border-black/15 py-3.5 text-[15px] font-bold text-neutral-900">Schliessen</button>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Zuletzt aktiv auf Matchup · vor 4 Min.</p>

          {/* Weitere Fotos */}
          {p.gallery.length > 0 && (
            <div className="mt-5 border-t border-black/[0.07] pt-4">
              <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Fotos</p>
              <div className="grid grid-cols-2 gap-2">
                {p.gallery.map((g, i) => (
                  <img key={i} src={g} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
