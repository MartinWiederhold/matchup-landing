"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

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

const STEP_KEYS = [
  "beratung.stepProfile",
  "beratung.stepStyle",
  "beratung.stepRacket",
  "beratung.stepBody",
  "beratung.stepBudget",
  "beratung.stepContact",
];

export default function BeratungWizard({ onClose }: { onClose?: () => void }) {
  const t = useT();
  const STEPS = STEP_KEYS.map((k) => t(k));
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
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }
  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError(t("beratung.errRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t("beratung.errEmail"));
      return;
    }
    if (!form.consent) {
      setError(t("beratung.errConsent"));
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
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("beratung.wizardTitle")}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {done
              ? t("beratung.requestSent")
              : t("beratung.stepOf", {
                  current: step + 1,
                  total: STEPS.length,
                  label: STEPS[step],
                })}
          </p>
        </div>
        {modal && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 text-sm transition-colors hover:bg-neutral-100"
            aria-label={t("beratung.closeAria")}
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
            <h3 className="mt-6 text-2xl font-bold tracking-tight">{t("beratung.thanks", { name: form.firstName })}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
              {t("beratung.doneText")}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="h-12 rounded-full border border-neutral-300 px-6 text-sm font-medium transition-colors hover:bg-neutral-100"
              >
                {t("beratung.newRequest")}
              </button>
              {modal && (
                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  {t("common.close")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {step === 0 && (
              <Section>
                <Radio label={t("beratung.qSport")} options={[t("beratung.optTennis"), t("beratung.optPadel"), t("beratung.optPickleball")]} value={form.sport} onChange={(v) => set("sport", v)} />
                <Radio label={t("beratung.qExperience")} options={[t("beratung.optExpBeginner"), t("beratung.optExpHobby"), t("beratung.optExpAdvanced"), t("beratung.optExpTournament"), t("beratung.optExpCoach")]} value={form.experience} onChange={(v) => set("experience", v)} />
                <Radio label={t("beratung.qFrequency")} options={[t("beratung.optFreqMonth"), t("beratung.optFreqWeek"), t("beratung.optFreqWeek23"), t("beratung.optFreqWeek4")]} value={form.frequency} onChange={(v) => set("frequency", v)} />
                <Radio label={t("beratung.qSurface")} options={[t("beratung.optIndoor"), t("beratung.optOutdoor"), t("beratung.optBoth")]} value={form.location} onChange={(v) => set("location", v)} />
                <Radio label={t("beratung.qMatches")} options={[t("beratung.optYes"), t("beratung.optNo"), t("beratung.optOccasionally")]} value={form.matches} onChange={(v) => set("matches", v)} />
              </Section>
            )}

            {step === 1 && (
              <Section>
                <Chips label={t("beratung.qStyle")} hint={t("beratung.hintMulti")} options={[t("beratung.optStyleDefensive"), t("beratung.optStyleAllround"), t("beratung.optStyleAggressive"), t("beratung.optStyleSpin"), t("beratung.optStyleFlat"), t("beratung.optStyleNet")]} values={form.style} onToggle={(v) => toggle("style", v)} />
                <Chips label={t("beratung.qPriorities")} hint={t("beratung.hintMulti")} options={[t("beratung.optPrioPower"), t("beratung.optPrioControl"), t("beratung.optPrioSpin"), t("beratung.optPrioComfort"), t("beratung.optPrioStrain"), t("beratung.optPrioPrecision"), t("beratung.optPrioSweetspot")]} values={form.priorities} onToggle={(v) => toggle("priorities", v)} />
              </Section>
            )}

            {step === 2 && (
              <Section>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label={t("beratung.qCurBrand")} value={form.curBrand} onChange={(v) => set("curBrand", v)} />
                  <Text label={t("beratung.qCurModel")} value={form.curModel} onChange={(v) => set("curModel", v)} />
                </div>
                <Text label={t("beratung.qCurWeight")} value={form.curWeight} onChange={(v) => set("curWeight", v)} />
                <Radio label={t("beratung.qGrip")} options={["L0", "L1", "L2", "L3", "L4", t("beratung.optGripUnknown")]} value={form.grip} onChange={(v) => set("grip", v)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label={t("beratung.qString")} value={form.string} onChange={(v) => set("string", v)} />
                  <Text label={t("beratung.qTension")} value={form.tension} onChange={(v) => set("tension", v)} />
                </div>
                <Radio label={t("beratung.qRestring")} options={[t("beratung.optRestringRare"), t("beratung.optRestringMonths"), t("beratung.optRestringRegular"), t("beratung.optRestringUnknown")]} value={form.restringFreq} onChange={(v) => set("restringFreq", v)} />
              </Section>
            )}

            {step === 3 && (
              <Section>
                <Radio label={t("beratung.qAge")} options={[t("beratung.optAgeChild"), t("beratung.optAgeTeen"), t("beratung.optAgeAdult")]} value={form.alter} onChange={(v) => set("alter", v)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label={t("beratung.qHeight")} value={form.height} onChange={(v) => set("height", v)} />
                  <Text label={t("beratung.qWeight")} value={form.weight} onChange={(v) => set("weight", v)} />
                </div>
                <Radio label={t("beratung.qHand")} options={[t("beratung.optHandRight"), t("beratung.optHandLeft")]} value={form.hand} onChange={(v) => set("hand", v)} />
              </Section>
            )}

            {step === 4 && (
              <Section>
                <Chips label={t("beratung.qIssues")} hint={t("beratung.hintMulti")} options={[t("beratung.optIssueNone"), t("beratung.optIssueTennisElbow"), t("beratung.optIssueWrist"), t("beratung.optIssueShoulder"), t("beratung.optIssueElbow"), t("beratung.optIssueOther")]} values={form.issues} onToggle={(v) => toggle("issues", v)} />
                <Area label={t("beratung.qIssuesText")} value={form.issuesText} onChange={(v) => set("issuesText", v)} rows={2} />
                <Radio label={t("beratung.qReason")} options={[t("beratung.optReasonFit"), t("beratung.optReasonUpgrade"), t("beratung.optReasonPain"), t("beratung.optReasonImprove"), t("beratung.optReasonOld"), t("beratung.optReasonFirst")]} value={form.reason} onChange={(v) => set("reason", v)} />
                <Radio label={t("beratung.qBudget")} options={[t("beratung.optBudgetUnder100"), t("beratung.optBudget100"), t("beratung.optBudget180"), t("beratung.optBudget250"), t("beratung.optBudgetOpen")]} value={form.budget} onChange={(v) => set("budget", v)} />
              </Section>
            )}

            {step === 5 && (
              <Section>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {t("beratung.contactIntro")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label={t("beratung.qFirstName")} value={form.firstName} onChange={(v) => set("firstName", v)} />
                  <Text label={t("beratung.qLastName")} value={form.lastName} onChange={(v) => set("lastName", v)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text label={t("beratung.qEmail")} type="email" value={form.email} onChange={(v) => set("email", v)} />
                  <Text label={t("beratung.qPhone")} value={form.phone} onChange={(v) => set("phone", v)} />
                </div>
                <Area label={t("beratung.qNotes")} hint={t("beratung.hintNotes")} value={form.notes} onChange={(v) => set("notes", v)} rows={3} />
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 accent-black"
                  />
                  <span className="text-neutral-700">
                    {t("beratung.consent")}
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
              {t("beratung.btnBack")}
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
                {t("beratung.btnNext")}
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="h-11 rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                {t("beratung.btnSend")}
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
