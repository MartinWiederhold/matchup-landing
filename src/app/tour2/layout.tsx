import { Instrument_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import Tour2Prefetch from "./components/Tour2Prefetch";
import Tour2Shell from "./components/shell/Tour2Shell";
import "./tour2.css";

// /tour2 — awwwards-Editorial (Weiß, Luft) × Matchup-Violett. noindex.
// Instrument Sans: neo-grotesk, premium — nur für /tour2, next/font (keine neue Dependency).
const t2Font = Instrument_Sans({
  variable: "--t2-font",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Tour2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Tour2Prefetch>
        <div className={t2Font.variable}>
          <Tour2Shell>{children}</Tour2Shell>
        </div>
      </Tour2Prefetch>
    </AuthProvider>
  );
}
