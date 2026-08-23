import { AuthProvider } from "@/lib/auth";

// /tour2 — NEUAUFBAU IM BAU. Bewusst NICHT verlinkt (weder von /tour noch anderswo);
// nur wer die Adresse kennt, landet hier. Aktuell exakte Kopie von /tour (Stand des
// Kopierens) — der eigentliche Umbau (Home-Start, fünf Bereiche, progressive Enthüllung,
// dunklere Gestaltung) folgt in Etappen. noindex, damit die Baustelle nicht auftaucht.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      {/* Fixes „Baustelle"-Badge — sichtbar, aber ohne das Vollhöhen-Planer-Layout zu stören. */}
      <div className="pointer-events-none fixed bottom-3 left-3 z-[200] rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold text-black shadow-lg ring-2 ring-white">
        🚧 /tour2 · Neuaufbau im Bau
      </div>
    </AuthProvider>
  );
}
