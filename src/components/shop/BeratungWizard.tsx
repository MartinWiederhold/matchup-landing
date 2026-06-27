"use client";

import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Mehrstufiger Wizard — Persönliche Schlägerberatung
   Rendert inline (Standard) oder als Modal-Inhalt (wenn onClose gesetzt ist).
   ────────────────────────────────────────────────────────────────────────── */

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alter: string;
  height: string;
  weight: string;
  hand: string;
  sport: string;
  experience: string;
  frequency: string;
  location: string;
  matches: string;
  style: string[];
  priorities: string[];
  curBrand: string;
  curModel: string;
  curWeight: string;
  grip: string;
  string: string;
  tension: string;
  restringFreq: string;
  issues: string[];
  issuesText: string;
  reason: string;
  budget: string;
  notes: string;
  consent: boolean;
};

const EMPTY: Form = {
  firstName: "", lastName: "", email: "", phone: "", alter: "", height: "",
  weight: "", hand: "", sport: "", experience: "", frequency: "", location: "",
  matches: "", style: [], priorities: [], curBrand: "", curModel: "",
  curWeight: "", grip: "", string: "", tension: "", restringFreq: "",
  issues: [], issuesText: "", reason: "", budget: "", notes: "", consent: false,
};

const STEPS = [
  "Persönliches",
  "Sport & Profil",
  "Spielstil",
  "Schläger & Saite",
  "Bedarf & Budget",
  "Abschluss",
];

export default function BeratungWizard({ onClose }: { onClose?: () => void }) {
  const modal = typeof onClose === "function";
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const firstRun = useRef(true);

  // Beim Schrittwechsel im Inline-Modus sanft zum Formular-Kopf scrollen –
  // aber NICHT beim ersten Render (sonst würde der Hero übersprungen).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!modal && typeof document !== "undefined") {
      document
        .getElementById("beratung-wizard")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step, done, modal]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }
  function toggle(key: "style" | "priorities" | "issues", value: string) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function next() {
    if (step === 0 && (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim())) {
      setError("Bitte Vorname, Nachname und E-Mail ausfüllen.");
      return;
    }
    if (step === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }
  function submit() {
    if (!form.consent) {
      setError("Bitte stimme der Verarbeitung deiner Angaben zu.");
      return;
    }
    // Demo: noch nicht an Backend/E-Mail angebunden.
    setDone(true);
  }
  function reset() {
    setStep(0);
    setForm(EMPTY);
    setDone(false);
    setError("");
  }

  return (
    <div
      id="beratung-wizard"
      className={
        modal
          ? "flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
          : "scroll-mt-24 w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)]"
      }
    >
      {/* Kopf */}
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5 sm:px-8">
        <div>
          <h2 className="font-serif text-2xl italic sm:text-3xl">
            Persönliche Schlägerberatung
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {done
              ? "Anfrage gesendet"
              : `Schritt ${step + 1} von ${STEPS.length} · ${STEPS[step]}`}
          </p>
        </div>
        {modal && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 text-sm transition-colors hover:bg-neutral-100"
            aria-label="Schließen"
          >
            ✕
          </button>
        )}
      </div>

      {!done && (
        <div className="h-1 w-full bg-neutral-100">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      )}

      {/* Inhalt */}
      <div
        className={`px-6 py-7 sm:px-8 ${modal ? "flex-1 overflow-y-auto" : ""}`}
      >
        {done ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">
              ✓
            </div>
            <h3 className="mt-6 font-serif text-2xl italic">Danke, {form.firstName}!</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
              Wir haben deine Anfrage erhalten und melden uns innerhalb von 24
              Stunden mit einer persönlichen Schläger-Empfehlung bei dir.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="h-12 rounded-full border border-neutral-300 px-6 text-sm font-medium transition-colors hover:bg-neutral-100"
              >
                Neue Anfrage
              </button>
              {modal && (
                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Schließen
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {step === 0 && (
              <Section>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Vorname *" value={form.firstName} onChange={(v) => set("firstName", v)} />
                  <Text label="Nachname *" value={form.lastName} onChange={(v) => set("lastName", v)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="E-Mail *" type="email" value={form.email} onChange={(v) => set("email", v)} />
                  <Text label="Telefon / WhatsApp (optional)" value={form.phone} onChange={(v) => set("phone", v)} />
                </div>
                <Radio label="Alter" options={["Kind (unter 12)", "Jugendlich (12–17)", "Erwachsen (18+)"]} value={form.alter} onChange={(v) => set("alter", v)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Körpergröße (cm)" value={form.height} onChange={(v) => set("height", v)} />
                  <Text label="Gewicht (kg, optional)" value={form.weight} onChange={(v) => set("weight", v)} />
                </div>
                <Radio label="Dominante Hand" options={["Rechts", "Links"]} value={form.hand} onChange={(v) => set("hand", v)} />
              </Section>
            )}

            {step === 1 && (
              <Section>
                <Radio label="Für welche Sportart suchst du Beratung?" options={["Tennis", "Padel", "Pickleball"]} value={form.sport} onChange={(v) => set("sport", v)} />
                <Radio label="Wie lange spielst du bereits?" options={["Anfänger (0–1 Jahr)", "Hobbyspieler", "Fortgeschritten", "Turnierspieler", "Coach / Trainer"]} value={form.experience} onChange={(v) => set("experience", v)} />
                <Radio label="Wie oft spielst du?" options={["1× pro Monat", "1× pro Woche", "2–3× pro Woche", "4×+ pro Woche"]} value={form.frequency} onChange={(v) => set("frequency", v)} />
                <Radio label="Wo spielst du hauptsächlich?" options={["Indoor", "Outdoor", "Beides"]} value={form.location} onChange={(v) => set("location", v)} />
                <Radio label="Spielst du Matches / Turniere?" options={["Ja", "Nein", "Gelegentlich"]} value={form.matches} onChange={(v) => set("matches", v)} />
              </Section>
            )}

            {step === 2 && (
              <Section>
                <Chips label="Wie würdest du deinen Spielstil beschreiben?" hint="Mehrfachauswahl möglich" options={["Defensiv / kontrolliert", "Allround", "Aggressiv / offensiv", "Viel Spin", "Flaches Spiel", "Netzspieler / Volley"]} values={form.style} onToggle={(v) => toggle("style", v)} />
                <Chips label="Was ist dir am wichtigsten?" hint="Mehrfachauswahl möglich" options={["Mehr Power", "Mehr Kontrolle", "Mehr Spin", "Mehr Komfort", "Weniger Belastung (Arm / Schulter)", "Mehr Präzision", "Größerer Sweetspot"]} values={form.priorities} onToggle={(v) => toggle("priorities", v)} />
              </Section>
            )}

            {step === 3 && (
              <Section>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Aktuelle Marke" value={form.curBrand} onChange={(v) => set("curBrand", v)} />
                  <Text label="Aktuelles Modell (optional)" value={form.curModel} onChange={(v) => set("curModel", v)} />
                </div>
                <Text label="Schlägergewicht (wenn bekannt)" value={form.curWeight} onChange={(v) => set("curWeight", v)} />
                <Radio label="Griffstärke (wenn bekannt)" options={["L0", "L1", "L2", "L3", "L4", "Weiß nicht"]} value={form.grip} onChange={(v) => set("grip", v)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label="Aktuelle Saite" value={form.string} onChange={(v) => set("string", v)} />
                  <Text label="Härte / Spannung (kg)" value={form.tension} onChange={(v) => set("tension", v)} />
                </div>
                <Radio label="Wie oft bespannst du neu?" options={["Sehr selten", "Alle paar Monate", "Regelmäßig", "Weiß nicht"]} value={form.restringFreq} onChange={(v) => set("restringFreq", v)} />
              </Section>
            )}

            {step === 4 && (
              <Section>
                <Chips label="Hast du aktuell Beschwerden?" hint="Mehrfachauswahl möglich" options={["Keine", "Tennisarm", "Handgelenk", "Schulter", "Ellbogen", "Sonstiges"]} values={form.issues} onToggle={(v) => toggle("issues", v)} />
                <Area label="Falls ja, bitte kurz beschreiben" value={form.issuesText} onChange={(v) => set("issuesText", v)} rows={2} />
                <Radio label="Warum möchtest du wechseln?" options={["Mein Schläger passt nicht mehr", "Ich brauche ein Upgrade", "Ich habe Schmerzen", "Ich möchte mein Spiel verbessern", "Mein Schläger ist alt", "Ich suche meinen ersten Schläger"]} value={form.reason} onChange={(v) => set("reason", v)} />
                <Radio label="Welches Budget hast du?" options={["Unter 100 CHF", "100–180 CHF", "180–250 CHF", "250+ CHF", "Offen für Empfehlung"]} value={form.budget} onChange={(v) => set("budget", v)} />
              </Section>
            )}

            {step === 5 && (
              <Section>
                <Area label="Gibt es noch etwas, das wir wissen sollten?" hint="z. B. Lieblingsmarken, No-Gos, Ziele, spezielle Wünsche" value={form.notes} onChange={(v) => set("notes", v)} rows={4} />
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 accent-black"
                  />
                  <span className="text-neutral-700">
                    Ich bin damit einverstanden, dass meine Angaben zur
                    persönlichen Beratung gespeichert und verarbeitet werden. *
                  </span>
                </label>
              </Section>
            )}
          </>
        )}
      </div>

      {/* Fußzeile */}
      {!done && (
        <div className="border-t border-neutral-200 px-6 py-4 sm:px-8">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="h-11 rounded-full border border-neutral-300 px-6 text-sm font-medium transition-colors enabled:hover:bg-neutral-100 disabled:opacity-40"
            >
              Zurück
            </button>
            <span className="hidden text-xs text-neutral-400 sm:block">
              {step + 1} / {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="h-11 rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Weiter
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="h-11 rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Anfrage senden
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Bausteine ─────────────────────────────────────────────────────────── */

function Section({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function Text({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-neutral-300 px-3.5 text-sm outline-none transition-colors focus:border-black"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
        {label}
      </span>
      {hint && <span className="mb-1.5 block text-xs text-neutral-400">{hint}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-neutral-300 p-3.5 text-sm outline-none transition-colors focus:border-black"
      />
    </label>
  );
}

function Radio({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              value === o
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-black"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chips({
  label,
  hint,
  options,
  values,
  onToggle,
}: {
  label: string;
  hint?: string;
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-neutral-500">
        {label}
      </span>
      {hint && <span className="mb-2 mt-0.5 block text-xs text-neutral-400">{hint}</span>}
      <div className={`flex flex-wrap gap-2 ${hint ? "" : "mt-2"}`}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              values.includes(o)
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-black"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
