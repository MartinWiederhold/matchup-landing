import { AuthProvider } from "@/lib/auth";
import Tour2Shell from "./components/shell/Tour2Shell";
import "./tour2.css";

// /tour2 — Neuaufbau. Helles Editorial, Matchup nur als Akzent. /tour unverändert. noindex.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tour2Shell>{children}</Tour2Shell>
      <div className="pointer-events-none fixed bottom-3 right-3 z-[200] border border-black/15 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-900">
        /tour2
      </div>
    </AuthProvider>
  );
}
