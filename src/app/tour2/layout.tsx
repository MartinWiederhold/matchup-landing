import { AuthProvider } from "@/lib/auth";
import { Oswald } from "next/font/google";
import Tour2Shell from "./components/shell/Tour2Shell";
import "./tour2.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-t2-display",
  weight: ["400", "500", "600"],
});

// /tour2 — Neuaufbau. Mix Day One × Cadillac F1 × Matchup. /tour unverändert. noindex.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className={oswald.variable}>
        <Tour2Shell>{children}</Tour2Shell>
        <div className="pointer-events-none fixed bottom-3 right-3 z-[200] border border-[var(--t2-ink)] bg-[var(--t2-paper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--t2-ink)]">
          /tour2
        </div>
      </div>
    </AuthProvider>
  );
}
