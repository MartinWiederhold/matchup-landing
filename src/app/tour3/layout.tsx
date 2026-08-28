import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./tour3.css";

/**
 * /tour3 — eigenständiger Prototyp. Bewusst neben /tour2, nicht statt dessen.
 *
 * Schriften über next/font (keine externen Skripte, keine neuen Pakete):
 *   Geist Sans   — Oberfläche und Fließtext
 *   Geist Mono   — technische Kleinbeschriftungen (Countdown, Delta, Kürzel)
 *   Fraunces     — nur für Anzeigezahlen (Ranking, Saisonbudget). Variable Serife
 *                  mit hohem Strichkontrast; opsz + SOFT als Variations-Achsen.
 * Die Variablen kommen als CSS-Variablen (`--font-geist-sans` etc.) und werden
 * in tour3.css referenziert.
 */

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["500", "600"] });
// Fraunces ist eine variable Serife. Wenn wir `axes` (opsz + SOFT) mitgeben,
// verlangt next/font, dass `weight` weggelassen wird — der Loader liefert
// dann die variable Ausprägung. font-weight in CSS wirkt trotzdem.
const fraunces  = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"] });

export const metadata: Metadata = {
  // Kein Suffix — das Root-Layout hängt „— Matchup" bereits an.
  title: "Saison",
  robots: { index: false, follow: false },
};

export default function Tour3Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} t3-root`}
        data-accent="indigo"
      >
        {children}
      </div>
    </AuthProvider>
  );
}
