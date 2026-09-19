import { Nunito } from "next/font/google";
import VisitorShell from "./components/VisitorShell";
import "../tour2/tour2.css";

/**
 * /tournaments — Besucher-Orientierung, öffentlich ohne Login.
 * Eigenes Layout neben /tour2, gleiche Optik (tour2.css), keine Wettkampf-Hülle.
 */

const nunito = Nunito({
  variable: "--font-t2-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata = {
  robots: { index: false, follow: false },
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={nunito.variable}>
      <VisitorShell>{children}</VisitorShell>
    </div>
  );
}
