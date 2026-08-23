import { AuthProvider } from "@/lib/auth";
import Tour2Shell from "./components/shell/Tour2Shell";

// /tour2 — NEUAUFBAU IM BAU. Bewusst NICHT verlinkt (weder von /tour noch anderswo).
// Etappe 1: Navigations-Gerüst (fünf Bereiche) + Home, dunkles Tool-Mode. Die übrigen
// (kopierten) Ansichten sind noch hell und werden in späteren Etappen umgebaut. noindex.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tour2Shell>{children}</Tour2Shell>
      {/* Fixes „Baustelle"-Badge — sichtbar, dass /tour2 im Bau ist. */}
      <div className="pointer-events-none fixed bottom-3 right-3 z-[200] rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold text-black shadow-lg ring-2 ring-black/20">
        🚧 /tour2 · Neuaufbau im Bau
      </div>
    </AuthProvider>
  );
}
