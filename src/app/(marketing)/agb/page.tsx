import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung von Matchup.",
  alternates: { canonical: "/agb" },
  robots: { index: false, follow: true },
};

export default function AgbPage() {
  return (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      subtitle="Bedingungen für die Nutzung der Matchup-Plattform."
      updated="Stand: Juni 2026"
      sections={[
        {
          heading: "1. Geltungsbereich",
          body: [
            "Diese AGB gelten für die Nutzung der App und Website von Matchup („Dienst") durch registrierte Nutzerinnen und Nutzer.",
          ],
        },
        {
          heading: "2. Leistung",
          body: [
            "Matchup vermittelt Spielpartner für Tennis, Padel und Pickleball und ermöglicht das Organisieren von Spielen, Events und den Austausch in der Community. Es besteht kein Anspruch auf ein erfolgreiches Match oder eine ständige Verfügbarkeit des Dienstes.",
          ],
        },
        {
          heading: "3. Registrierung & Konto",
          body: [
            "Für die Nutzung ist ein Konto erforderlich. Die angegebenen Daten müssen wahrheitsgemäss sein. Du bist für die Geheimhaltung deiner Zugangsdaten selbst verantwortlich. Die Nutzung ist erst ab 18 Jahren gestattet.",
          ],
        },
        {
          heading: "4. Verhaltensregeln",
          body: [
            "Belästigung, Diskriminierung, Spam, Fake-Profile sowie rechtswidrige Inhalte sind untersagt. Verstösse können zur Sperrung des Kontos führen. Nutzer können andere Profile melden und blockieren.",
          ],
        },
        {
          heading: "5. Haftung",
          body: [
            "Matchup haftet nicht für das Verhalten anderer Nutzer oder für Treffen, die über die Plattform zustande kommen. Die Nutzung erfolgt auf eigene Verantwortung. Für Schäden haften wir nur bei Vorsatz oder grober Fahrlässigkeit, soweit gesetzlich zulässig.",
          ],
        },
        {
          heading: "6. Kündigung",
          body: [
            "Du kannst dein Konto jederzeit löschen. Wir behalten uns vor, Konten bei Verstössen gegen diese AGB zu sperren oder zu löschen.",
          ],
        },
        {
          heading: "7. Änderungen & anwendbares Recht",
          body: [
            "Wir können diese AGB anpassen; die jeweils aktuelle Fassung gilt. Es gilt das Recht der Schweiz, soweit gesetzlich zulässig.",
          ],
        },
      ]}
    />
  );
}
