import { Link } from 'react-router-dom';

const COPY = {
  en: { privacy: 'Privacy', impressum: 'Imprint', contact: 'Contact' },
  de: { privacy: 'Datenschutz', impressum: 'Impressum', contact: 'Kontakt' },
};

export default function Footer({ lang = 'en' }) {
  const t = COPY[lang] ?? COPY.en;
  return (
    <footer className="border-t border-line py-10 px-6 text-sm text-muted">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Matchup</p>
        <nav className="flex gap-6">
          <Link to="/privacy" className="hover:text-ink transition">
            {t.privacy}
          </Link>
          <Link to="/impressum" className="hover:text-ink transition">
            {t.impressum}
          </Link>
          <a
            href="mailto:wiederhold.martin@web.de"
            className="hover:text-ink transition"
          >
            {t.contact}
          </a>
        </nav>
      </div>
    </footer>
  );
}
