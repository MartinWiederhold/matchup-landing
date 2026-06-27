"use client";

import { useState } from "react";
import BeratungForm from "./shop/BeratungForm";

export default function BeratungCta() {
  const [open, setOpen] = useState(false);
  return (
    <section className="bg-black px-4 py-24 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl italic tracking-tight sm:text-5xl">
          Persönliche Schlägerberatung
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-neutral-300">
          Beantworte ein paar Fragen zu deinem Spiel — wir melden uns innerhalb
          von 24 Stunden mit einer persönlichen Schläger-Empfehlung, abgestimmt
          auf Level, Spielstil und Budget.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-9 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
        >
          Kostenlose Beratung anfragen →
        </button>
        <p className="mt-4 text-xs text-neutral-500">
          Unverbindlich · kostenlos · ca. 3 Minuten
        </p>
      </div>
      <BeratungForm open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
