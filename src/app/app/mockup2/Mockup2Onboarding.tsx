"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";

function Icon({ path, className = "", size = 22, fill = "none" }: { path: string; className?: string; size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const SPORTS = ["Tennis", "Padel", "Pickleball"];
const GOALS = ["Spass", "Wettkampf", "Training", "Sozial", "Fitness", "Regelmässig"];
const SKILLS: { key: string; desc: string; dot: string }[] = [
  { key: "Anfänger", desc: "Neu im Sport oder Wiedereinstieg", dot: "#10b981" },
  { key: "Mittel", desc: "Solide Grundtechnik, regelmässig aktiv", dot: "#f59e0b" },
  { key: "Fortgeschritten", desc: "Sicher in Match-Situationen", dot: "#f97316" },
  { key: "Profi", desc: "Turnier-/Wettkampfniveau", dot: "#4b3bf3" },
];
const TOTAL = 12;

export default function Mockup2Onboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<"de" | "en" | null>("de");
  const [sports, setSports] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [club, setClub] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"m" | "w" | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [height, setHeight] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const seed = useRef(200);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const valid = (() => {
    switch (step) {
      case 2: return lang !== null;
      case 3: return sports.length >= 1;
      case 4: return city.trim().length > 1;
      case 6: return name.trim().length >= 2;
      case 7: return Number(age) >= 18 && Number(age) <= 100;
      case 8: return gender !== null;
      case 9: return skill !== null;
      case 11: return goals.length >= 1;
      case 12: return photos.length >= 1;
      default: return true; // 1 Welcome, 5 Club, 10 Größe optional
    }
  })();

  const next = () => (step >= TOTAL ? onClose() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col bg-white">
      {/* Kopf: Fortschritt */}
      <div className="flex items-center gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        {step > 1 ? (
          <button type="button" onClick={back} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 active:bg-black/5"><Icon path="M15 18l-6-6 6-6" size={22} /></button>
        ) : (
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 active:bg-black/5"><Icon path="M18 6 6 18M6 6l12 12" size={20} /></button>
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-matchup transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-[11px] font-bold text-neutral-400">{step}/{TOTAL}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        {step === 1 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-matchup to-indigo-600 text-white shadow-lg">
              <Icon path="M12 2 4 7v10l8 5 8-5V7z" size={38} />
            </span>
            <h1 className="mt-6 text-[26px] font-extrabold tracking-tight text-neutral-900">Willkommen bei Matchup</h1>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-neutral-500">Finde Spielpartner für Tennis, Padel & Pickleball in deiner Nähe. Lass uns dein Profil einrichten.</p>
          </div>
        )}

        {step === 2 && (
          <Step title="Sprache" sub="In welcher Sprache möchtest du Matchup nutzen?">
            <div className="space-y-2">
              {([["de", "Deutsch"], ["en", "English"]] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setLang(k)} className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-4 text-left font-semibold transition-colors ${lang === k ? "border-matchup bg-matchup/5 text-neutral-900" : "border-black/10 text-neutral-700"}`}>
                  {label}
                  {lang === k && <Icon path="M20 6 9 17l-5-5" size={18} className="text-matchup" />}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="Sportarten" sub="Welche Sportarten spielst du? (Mehrfachauswahl)">
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <button key={s} type="button" onClick={() => toggle(sports, setSports, s)} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${sports.includes(s) ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>{s}</button>
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step title="Wo spielst du?" sub="Deine Stadt — für Partner & Spiele in der Nähe.">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="z. B. Zürich" className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />
          </Step>
        )}

        {step === 5 && (
          <Step title="Dein Club" sub="Optional — spielst du in einem Verein?">
            <input value={club} onChange={(e) => setClub(e.target.value)} placeholder="Club suchen…" className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />
            <p className="mt-2 text-xs text-neutral-400">Kannst du auch später hinzufügen.</p>
          </Step>
        )}

        {step === 6 && (
          <Step title="Wie heisst du?" sub="Dein Vorname, so sehen dich andere.">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vorname" className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />
          </Step>
        )}

        {step === 7 && (
          <Step title="Wie alt bist du?" sub="Nur dein Alter ist für andere sichtbar.">
            <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" placeholder="Alter" className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-center text-2xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300" />
          </Step>
        )}

        {step === 8 && (
          <Step title="Geschlecht">
            <div className="space-y-2">
              {([["m", "Männlich"], ["w", "Weiblich"]] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setGender(k)} className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-4 text-left font-semibold transition-colors ${gender === k ? "border-matchup bg-matchup/5 text-neutral-900" : "border-black/10 text-neutral-700"}`}>
                  {label}
                  {gender === k && <Icon path="M20 6 9 17l-5-5" size={18} className="text-matchup" />}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 9 && (
          <Step title="Dein Level" sub="Wie schätzt du dich ein?">
            <div className="space-y-2">
              {SKILLS.map((s) => (
                <button key={s.key} type="button" onClick={() => setSkill(s.key)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${skill === s.key ? "border-matchup bg-matchup/5" : "border-black/10"}`}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.dot }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900">{s.key}</span>
                    <span className="block text-xs text-neutral-500">{s.desc}</span>
                  </span>
                  {skill === s.key && <Icon path="M20 6 9 17l-5-5" size={18} className="text-matchup" />}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 10 && (
          <Step title="Grösse" sub="Optional (cm).">
            <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" placeholder="z. B. 183" className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-center text-2xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300" />
          </Step>
        )}

        {step === 11 && (
          <Step title="Deine Ziele" sub="Was suchst du bei Matchup? (Mehrfachauswahl)">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button key={g} type="button" onClick={() => toggle(goals, setGoals, g)} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${goals.includes(g) ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}>{g}</button>
              ))}
            </div>
          </Step>
        )}

        {step === 12 && (
          <Step title="Fotos" sub="Mindestens ein Foto — das erste ist dein Hauptfoto.">
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-black/[0.05]">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-matchup px-1.5 py-0.5 text-[9px] font-bold text-white">Haupt</span>}
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"><Icon path="M18 6 6 18M6 6l12 12" size={12} /></button>
                </div>
              ))}
              {photos.length < 6 && (
                <button type="button" onClick={() => setPhotos((p) => [...p, `https://picsum.photos/seed/ob${seed.current++}/300/300`])} className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-black/15 text-neutral-400"><Icon path="M12 5v14M5 12h14" size={24} /></button>
              )}
            </div>
          </Step>
        )}
      </div>

      {/* Fuss: Weiter */}
      <div className="border-t border-black/10 px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={next} disabled={!valid} className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white transition disabled:opacity-40">
          {step === 1 ? "Los geht's" : step === TOTAL ? "Profil erstellen" : "Weiter"}
        </button>
        {(step === 5 || step === 10) && (
          <button type="button" onClick={next} className="mt-2 w-full py-1 text-sm font-medium text-neutral-500">Überspringen</button>
        )}
      </div>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-tight text-neutral-900">{title}</h1>
      {sub && <p className="mt-1 mb-5 text-sm text-neutral-500">{sub}</p>}
      {!sub && <div className="mb-5" />}
      {children}
    </div>
  );
}
