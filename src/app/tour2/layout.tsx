import { Nunito } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import Tour2Prefetch from "./components/Tour2Prefetch";
import Tour2Shell from "./components/shell/Tour2Shell";
import "./tour2.css";

// /tour2 — helle, farbenfrohe Neuausrichtung × Matchup-Violett. noindex.
// Schriften über next/font (keine externen Skripte, keine neuen Pakete):
//   Body/UI  — DM Sans aus dem Root-Layout (Marketing/Play-Parität).
//   Display  — Nunito: runde, freundliche Grotesk NUR für Überschriften und
//              große Zahlen. Kommt als CSS-Variable `--font-t2-display` und
//              wird in tour2.css referenziert (Fallback: DM Sans).
const nunito = Nunito({
  variable: "--font-t2-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tour2Prefetch>
        {/* Die Font-Variable liegt auf einem Vorfahren von .t2-root; CSS-Custom-
            Properties erben, damit greift `var(--font-t2-display)` überall darin. */}
        <div className={nunito.variable}>
          <Tour2Shell>{children}</Tour2Shell>
        </div>
      </Tour2Prefetch>
    </AuthProvider>
  );
}
