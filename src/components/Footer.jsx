import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line py-10 px-6 text-sm text-muted">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Matchup</p>
        <nav className="flex gap-6">
          <Link to="/privacy" className="hover:text-ink transition">
            Datenschutz
          </Link>
          <Link to="/impressum" className="hover:text-ink transition">
            Impressum
          </Link>
          <a
            href="mailto:wiederhold.martin@web.de"
            className="hover:text-ink transition"
          >
            Kontakt
          </a>
        </nav>
      </div>
    </footer>
  );
}
