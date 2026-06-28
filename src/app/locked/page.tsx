"use client";

import { useState } from "react";

export default function LockedPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <span className="matchup-wordmark text-2xl font-bold">MATCHUP</span>
        <h1 className="mt-10 text-2xl font-bold tracking-tight">
          Bald geht&apos;s los
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Diese Seite ist derzeit privat. Gib den Zugangscode ein, um
          fortzufahren.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            placeholder="Zugangscode"
            className={`w-full rounded-full bg-white/10 px-5 py-3.5 text-center text-base tracking-widest text-white placeholder:text-white/40 outline-none ring-1 transition-colors ${
              error ? "ring-red-500" : "ring-white/15 focus:ring-matchup"
            }`}
          />
          {error && (
            <p className="text-sm text-red-400">Falscher Code. Bitte erneut versuchen.</p>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover disabled:opacity-50"
          >
            {loading ? "Prüfe …" : "Entsperren"}
          </button>
        </form>
      </div>
    </main>
  );
}
