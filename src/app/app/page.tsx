import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matchup App",
};

// Platzhalter — wird in Phase 7 durch die echte App-Shell ersetzt.
export default function AppPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
      <span className="matchup-wordmark text-3xl font-bold tracking-[0.2em]">
        MATCHUP
      </span>
      <p className="mt-4 text-sm text-white/60">Die App wird gerade gebaut.</p>
      <a
        href="/"
        className="mt-8 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white hover:text-black"
      >
        Zurück zur Startseite
      </a>
    </div>
  );
}
