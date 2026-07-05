import type { Metadata } from "next";
import ResetPassword from "./ResetPassword";

export const metadata: Metadata = {
  title: "Passwort zurücksetzen – Matchup",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPassword />;
}
