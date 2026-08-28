import { AuthProvider } from "@/lib/auth";
import Tour2Prefetch from "./components/Tour2Prefetch";
import Tour2Shell from "./components/shell/Tour2Shell";
import "./tour2.css";

// /tour2 — warmes Hell × Matchup-Violett. noindex.
// Schrift: DM Sans aus dem Root-Layout (Marketing/Play-Parität). Die frühere
// Instrument-Sans-Instanz wurde in Etappe 1 des Redesigns zurückgezogen.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tour2Prefetch>
        <Tour2Shell>{children}</Tour2Shell>
      </Tour2Prefetch>
    </AuthProvider>
  );
}
