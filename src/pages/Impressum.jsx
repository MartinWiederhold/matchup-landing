import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

export default function Impressum() {
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
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Impressum
          </h1>

          <section className="mt-10 space-y-2 text-base leading-relaxed">
            <p className="font-semibold">Martin Wiederhold</p>
            <p>matchup-app.com</p>
            <p>
              <a
                href="mailto:wiederhold.martin@web.de"
                className="underline hover:text-ink"
              >
                wiederhold.martin@web.de
              </a>
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold">Verantwortlich für den Inhalt</h2>
            <p className="mt-2 text-base leading-relaxed">
              Martin Wiederhold (Anschrift wie oben).
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold">Haftungsausschluss</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Die Inhalte dieser Seite und der App wurden mit grösster Sorgfalt
              erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität wird jedoch
              keine Gewähr übernommen. Für externe Links übernehmen wir keine Haftung —
              für die Inhalte verlinkter Seiten ist ausschliesslich deren jeweiliger
              Betreiber verantwortlich.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
