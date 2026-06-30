import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Wie Matchup deine personenbezogenen Daten verarbeitet und schützt.",
  alternates: { canonical: "/datenschutz" },
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutz"
      subtitle="Informationen zur Verarbeitung deiner personenbezogenen Daten (DSG / DSGVO)."
      updated="Stand: Juni 2026"
      sections={[
        {
          heading: "1. Verantwortliche Stelle",
          body: [
            "Verantwortlich für die Datenverarbeitung ist:\n[Firmenname / Inhaber], [Adresse]\nE-Mail: swissflow@bluewin.ch",
          ],
        },
        {
          heading: "2. Welche Daten wir verarbeiten",
          body: [
            "Bei der Registrierung und Nutzung von Matchup verarbeiten wir: E-Mail-Adresse, Profilangaben (Name, Alter, Geschlecht, Sportarten, Spielstärke, Standort/Region, Fotos, Bio), Match- und Nachrichtendaten sowie technische Daten (z. B. Geräte-/Nutzungsdaten).",
          ],
        },
        {
          heading: "3. Zwecke und Rechtsgrundlagen",
          body: [
            "Wir verarbeiten deine Daten, um den Dienst bereitzustellen (Profil, Matching, Chat, Events), die Sicherheit zu gewährleisten und den Dienst zu verbessern. Rechtsgrundlage ist die Vertragserfüllung sowie dein Einverständnis bzw. unser berechtigtes Interesse.",
          ],
        },
        {
          heading: "4. Weitergabe an Dritte / Auftragsverarbeiter",
          body: [
            "Zur Bereitstellung des Dienstes nutzen wir Dienstleister (u. a. Hosting/Datenbank über Supabase und Vercel). Diese verarbeiten Daten ausschliesslich in unserem Auftrag. Eine Übermittlung erfolgt nur, soweit für den Betrieb erforderlich.",
          ],
        },
        {
          heading: "5. Speicherdauer",
          body: [
            "Wir speichern deine Daten, solange dein Konto besteht. Nach Löschung deines Profils werden die zugehörigen Daten gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
          ],
        },
        {
          heading: "6. Deine Rechte",
          body: [
            "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit und Widerspruch. Wende dich dazu an swissflow@bluewin.ch.",
          ],
        },
        {
          heading: "7. Kontakt",
          body: [
            "Bei Fragen zum Datenschutz erreichst du uns unter swissflow@bluewin.ch.",
          ],
        },
      ]}
    />
  );
}
