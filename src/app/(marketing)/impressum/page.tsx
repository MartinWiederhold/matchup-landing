import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und Anbieterkennzeichnung von Matchup.",
  alternates: { canonical: "/impressum" },
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      subtitle="Angaben gemäss gesetzlicher Anbieterkennzeichnung."
      updated="Stand: Juni 2026"
      sections={[
        {
          heading: "Anbieter",
          body: [
            "[Firmenname / Inhaber]\n[Strasse und Hausnummer]\n[PLZ Ort]\n[Land]",
          ],
        },
        {
          heading: "Kontakt",
          body: ["E-Mail: swissflow@bluewin.ch"],
        },
        {
          heading: "Handelsregister / UID",
          body: [
            "[Handelsregister-Nr. / UID-Nr., falls vorhanden]\n[Vertretungsberechtigte Person]",
          ],
        },
        {
          heading: "Haftungsausschluss",
          body: [
            "Die Inhalte dieser Seite wurden mit grösstmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird jedoch keine Gewähr übernommen.",
            "Für Inhalte externer Links sind ausschliesslich deren Betreiber verantwortlich.",
          ],
        },
      ]}
    />
  );
}
