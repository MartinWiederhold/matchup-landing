import { AuthProvider } from "@/lib/auth";
import Tour2Shell from "./components/shell/Tour2Shell";

// /tour2 — Neuaufbau. Fünf Bereiche dunkel; Werkzeugseiten nutzen Tour2Subpage
// (dunkler Kopf, Formulare in heller Fläche). /tour bleibt unverändert. noindex.
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
