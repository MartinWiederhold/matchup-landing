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

type Person = {
  name: string; age: number; city: string; level: string; sports: string[];
  score: number; matches: number; winrate: string; height: number; bio: string;
  img: string; gallery: string[];
};

const PEOPLE: Person[] = [
  { name: "Elena", age: 27, city: "Zürich", level: "Fortgeschritten", sports: ["Tennis", "Padel"], score: 1180, matches: 38, winrate: "58 %", height: 172, bio: "Spiele seit 12 Jahren Tennis, seit einem Jahr auch Padel. Suche regelmässige Partner für Feierabend-Matches.", img: "https://i.pravatar.cc/600?img=24", gallery: ["https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=600&q=70", "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=70", "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=70", "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=600&q=70"] },
  { name: "Marco", age: 34, city: "Winterthur", level: "Turnierspieler", sports: ["Tennis"], score: 1420, matches: 91, winrate: "67 %", height: 186, bio: "Ambitionierter Turnierspieler, suche starke Gegner für Trainingsmatches. Ernst, aber immer fair.", img: "https://i.pravatar.cc/600?img=18", gallery: ["https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600&q=70", "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=600&q=70", "https://images.unsplash.com/photo-1530915365347-e35b749a0381?w=600&q=70"] },
  { name: "Priya", age: 24, city: "Zürich", level: "Mittel", sports: ["Padel", "Pickleball"], score: 1010, matches: 14, winrate: "50 %", height: 165, bio: "Neu in der Padel-Welt und total begeistert! Suche entspannte Leute zum gemeinsamen Lernen.", img: "https://i.pravatar.cc/600?img=45", gallery: ["https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=70", "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=70"] },
  { name: "Tom", age: 31, city: "Zug", level: "Fortgeschritten", sports: ["Tennis", "Pickleball"], score: 1150, matches: 52, winrate: "55 %", height: 179, bio: "Feierabend-Spieler mit viel Herzblut. Tennis im Sommer, Pickleball im Winter.", img: "https://i.pravatar.cc/600?img=53", gallery: ["https://images.unsplash.com/photo-1530915365347-e35b749a0381?w=600&q=70", "https://images.unsplash.com/photo-1551773148-c9f6bbe02b12?w=600&q=70"] },
  { name: "Yuki", age: 29, city: "Luzern", level: "Mittel", sports: ["Tennis"], score: 1060, matches: 23, winrate: "48 %", height: 170, bio: "Spiele zum Ausgleich und um fit zu bleiben. Kein Leistungsdruck – Hauptsache Bewegung und gute Laune.", img: "https://i.pravatar.cc/600?img=41", gallery: ["https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=600&q=70", "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600&q=70"] },
  { name: "Ben", age: 36, city: "Basel", level: "Fortgeschritten", sports: ["Padel"], score: 1240, matches: 64, winrate: "60 %", height: 183, bio: "Padel-Fan der ersten Stunde. Organisiere regelmässig Doppel-Runden und freue mich über neue Mitspieler.", img: "https://i.pravatar.cc/600?img=57", gallery: ["https://images.unsplash.com/photo-1617083277624-4b7a2a1f7f0f?w=600&q=70", "https://images.unsplash.com/photo-1551773148-c9f6bbe02b12?w=600&q=70"] },
];

export default function Mockup2SelectProfileWhite() {
  const [sel, setSel] = useState<Person | null>(null);
  const [connected, setConnected] = useState(false);

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col overflow-hidden bg-white text-neutral-900">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-4 text-neutral-900">
          <Icon path="M12 5v14M5 12h14" size={26} />
          <Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={24} />
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-neutral-700">
          <Icon path="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.5 7.6 18l.9-5.5-4-3.9L10 8z" size={16} />
        </span>
      </div>
      <h1 className="px-5 pt-5 text-[46px] font-extrabold leading-[0.92] tracking-tight text-neutral-900">Select<br />Profile</h1>

      {/* Weisse Übersicht — Grid aller Profile */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-7">
        <div className="grid grid-cols-2 gap-x-5 gap-y-7">
          {PEOPLE.map((p) => (
            <button key={p.name} type="button" onClick={() => { setSel(p); setConnected(false); }} className="flex flex-col items-center">
              <img src={p.img} alt="" className="aspect-square w-full rounded-full object-cover" />
              <span className="mt-3 text-[15px] font-semibold text-neutral-900">@{p.name.toLowerCase()}</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">{p.sports[0]} · {p.level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schwarze Detailkarte (Popup) beim Klick auf ein Profil */}
      {sel && (
        <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSel(null)}>
          <div className="max-h-[86vh] overflow-hidden p-3.5" onClick={(e) => e.stopPropagation()}>
            <div className="max-h-[calc(86vh-28px)] overflow-y-auto rounded-[26px] bg-neutral-950 p-5 pb-4 text-white shadow-2xl ring-1 ring-white/10">
              {/* Kopf: Vorname links, Profilbild oben rechts im Kreis */}
              <div className="flex items-start justify-between">
                <h2 className="text-[42px] font-extrabold leading-none tracking-tight">{sel.name}</h2>
                <img src={sel.img} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/15" />
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { label: "Username", value: `@${sel.name.toLowerCase()}` },
                  { label: "Alter", value: `${sel.age}` },
                  { label: "Grösse", value: `${sel.height} cm` },
                  { label: "Level", value: sel.level },
                  { label: "Sportarten", value: sel.sports.join(", ") },
                  { label: "Stadt", value: sel.city },
                  { label: "Matchscore", value: `${sel.score}` },
                  { label: "Bilanz", value: `${sel.matches} Spiele · ${sel.winrate}` },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-[15px] text-white/45">{r.label}</span>
                    <span className="text-[15px] font-semibold text-white">{r.value}</span>
                  </div>
                ))}
              </div>

              {sel.bio && <p className="mt-4 text-[13.5px] leading-relaxed text-white/55">{sel.bio}</p>}

              <div className="mt-4 flex gap-2.5">
                <button type="button" onClick={() => setConnected(true)} className={`flex-1 rounded-full py-3.5 text-[15px] font-bold ${connected ? "bg-emerald-500/20 text-emerald-300" : "bg-white text-neutral-900"}`}>
                  {connected ? "Angefragt ✓" : "Verbinden"}
                </button>
                <button type="button" onClick={() => setSel(null)} className="flex-1 rounded-full border border-white/25 py-3.5 text-[15px] font-bold text-white">Schliessen</button>
              </div>
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Zuletzt aktiv auf Matchup · vor 4 Min.</p>

              {/* Weitere Fotos */}
              {sel.gallery.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Fotos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {sel.gallery.map((g, i) => (
                      <img key={i} src={g} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
