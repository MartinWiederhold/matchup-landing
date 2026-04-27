import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight">
            Matchup<span>.</span>
          </Link>
          <Link to="/" className="text-sm text-muted hover:text-ink">
            ← Zurück
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <article className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-muted mt-2">
            Stand: {new Date().toLocaleDateString('de-CH')}
          </p>

          <Section title="1. Verantwortliche Stelle">
            <p>
              Martin Wiederhold<br />
              wiederhold.martin@web.de<br />
              <a
                href="https://matchup-app.com"
                className="underline hover:text-ink"
              >
                matchup-app.com
              </a>
            </p>
          </Section>

          <Section title="2. Welche Daten wir verarbeiten">
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>Profildaten (Name, Alter, Geschlecht, Sport, Spielstärke, Club, Stadt, Bild)</li>
              <li>Standortdaten (mit deiner Zustimmung) zur Spielerempfehlung</li>
              <li>Push-Tokens (Firebase Cloud Messaging) für Benachrichtigungen</li>
              <li>Inhalte deiner Spiele, Likes, Matches und Chats</li>
              <li>Technische Daten (Gerätetyp, App-Version, Logs zur Fehlerbehebung)</li>
            </ul>
          </Section>

          <Section title="3. Zweck der Verarbeitung">
            <p className="text-sm leading-relaxed">
              Wir verarbeiten deine Daten ausschliesslich, um dir die App-Funktionen
              bereitzustellen — Profile-Matching, Spielorganisation, Chats und
              Community-Features. Wir verkaufen keine Daten an Dritte.
            </p>
          </Section>

          <Section title="4. Speicherort & Drittanbieter">
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
              <li>
                <strong>Supabase</strong> (EU-Region) — Authentifizierung, Datenbank,
                Storage
              </li>
              <li>
                <strong>Firebase Cloud Messaging</strong> — Push-Benachrichtigungen
              </li>
              <li>
                <strong>Apple / Google</strong> — App-Distribution
              </li>
            </ul>
          </Section>

          <Section title="5. Deine Rechte">
            <p className="text-sm leading-relaxed">
              Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung oder
              Einschränkung der Verarbeitung deiner Daten. Schreibe an{' '}
              <a
                href="mailto:wiederhold.martin@web.de"
                className="underline hover:text-ink"
              >
                wiederhold.martin@web.de
              </a>
              . Innerhalb der App kannst du dein Konto unter
              <em> Profil → Einstellungen → Konto löschen </em>
              eigenständig löschen.
            </p>
          </Section>

          <Section title="6. Cookies & Tracking">
            <p className="text-sm leading-relaxed">
              Diese Webseite verwendet keine Cookies und kein Tracking. Die App nutzt
              Standard-Authentifizierungs-Tokens (Supabase) und Push-Tokens (FCM).
            </p>
          </Section>

          <Section title="7. Kontakt">
            <p className="text-sm leading-relaxed">
              Bei Fragen zum Datenschutz erreichst du uns unter{' '}
              <a
                href="mailto:wiederhold.martin@web.de"
                className="underline hover:text-ink"
              >
                wiederhold.martin@web.de
              </a>
              .
            </p>
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 text-ink">{children}</div>
    </section>
  );
}
