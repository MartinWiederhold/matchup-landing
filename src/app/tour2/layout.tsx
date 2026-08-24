import { AuthProvider } from "@/lib/auth";
import Tour2Shell from "./components/shell/Tour2Shell";
import "./tour2.css";

// /tour2 — Day One (Luft, Creme) × Matchup-Akzent. Kein Oswald, /tour unverändert. noindex.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tour2Shell>{children}</Tour2Shell>
      <div className="pointer-events-none fixed bottom-3 right-3 z-[200] rounded-md border border-[var(--t2-line)] bg-[var(--t2-paper)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--t2-muted)]">
        /tour2
      </div>
    </AuthProvider>
  );
}
