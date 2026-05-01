import { useEffect, useRef, useState } from 'react';
import Footer from '../components/Footer.jsx';
import TennisBalls3D from '../components/TennisBalls3D.jsx';

const COPY = {
  en: {
    eyebrow: 'TENNIS · PADEL · SWITZERLAND',
    title: 'Matchup',
    tagline: 'Find your perfect playing partner.',
    appStore: 'App Store',
    androidDownload: 'Android',
    download: 'Download',
    featuresTitle: 'Everything for your next match.',
    featuresSubtitle:
      'From the first like to game time — Matchup walks with you every step.',
    features: [
      { key: 'discover',  title: 'Discover Players', body: 'Find players near you. Filter by skill level, sport and distance.' },
      { key: 'chat',      title: 'Match & Chat',     body: 'Like each other and start chatting. Set up your next game directly.' },
      { key: 'games',     title: 'Open Games',       body: 'Create open games or join existing ones near you.' },
      { key: 'groups',    title: 'Groups',           body: 'Join groups or create your own. Organize regular meetups.' },
      { key: 'community', title: 'Community',        body: 'Share updates, follow players and connect with the community.' },
      { key: 'analytics', title: 'Analytics',        body: 'Track your progress with stats, achievements and your player level.' },
    ],
    ctaTitle: 'Ready to play?',
    ctaBody:
      'Matchup is on the App Store now. Android users can download the app directly today.',
    ctaContact: 'Beta access or questions?',
  },
  de: {
    eyebrow: 'TENNIS · PADEL · SCHWEIZ',
    title: 'Matchup',
    tagline: 'Finde deinen perfekten Spielpartner.',
    appStore: 'App Store',
    androidDownload: 'Android',
    download: 'Download',
    featuresTitle: 'Alles für dein nächstes Match.',
    featuresSubtitle:
      'Vom ersten Like bis zum Spiel — Matchup begleitet dich durch jeden Schritt.',
    features: [
      { key: 'discover',  title: 'Spieler entdecken', body: 'Finde Spieler:innen in deiner Nähe. Filter nach Spielstärke, Sport und Distanz.' },
      { key: 'chat',      title: 'Matchen & Chatten', body: 'Liked ihr euch gegenseitig, könnt ihr direkt chatten und das nächste Spiel planen.' },
      { key: 'games',     title: 'Offene Spiele',     body: 'Erstelle offene Spiele oder tritt bestehenden in deiner Nähe bei.' },
      { key: 'groups',    title: 'Gruppen',           body: 'Tritt Gruppen bei oder erstelle eigene. Organisiere regelmässige Treffen.' },
      { key: 'community', title: 'Community',         body: 'Teile Updates, folge Spieler:innen und werde Teil der Community.' },
      { key: 'analytics', title: 'Statistiken',       body: 'Tracke deinen Fortschritt mit Stats, Achievements und deinem Spieler-Level.' },
    ],
    ctaTitle: 'Bereit zu spielen?',
    ctaBody:
      'Matchup ist jetzt im App Store. Android-User können die App direkt herunterladen.',
    ctaContact: 'Beta-Zugang oder Fragen?',
  },
};

function AppleGlyph(props) {
  return (
    <svg
      viewBox="0 0 384 512"
      className={props.className ?? 'w-5 h-5 fill-current'}
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function AndroidGlyph(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className ?? 'w-5 h-5'}
      aria-hidden="true"
    >
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
    </svg>
  );
}

/// Minimal line-style feature icons. Stroke #1A1A1A, 1.6 weight, 48x48.
function FeatureIcon({ kind }) {
  const common = {
    width: 48,
    height: 48,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: '#1A1A1A',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
  switch (kind) {
    case 'discover':
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="9" />
          <line x1="27" y1="27" x2="36" y2="36" />
          <circle cx="20" cy="17" r="3" />
          <path d="M14 24 c1.5 -2 4 -3 6 -3 s4.5 1 6 3" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M10 14 h22 a4 4 0 0 1 4 4 v10 a4 4 0 0 1 -4 4 H22 l-7 6 v-6 h-5 a4 4 0 0 1 -4 -4 V18 a4 4 0 0 1 4 -4 z" />
          <path d="M21 24 c-1 0 -2 -1 -2 -2 c0 -1 1 -2 2 -2 c1 0 2 1 2 2 c0 -1 1 -2 2 -2 c1 0 2 1 2 2 c0 1 -1 2 -2 2 c0 1 -2 2 -4 4 c-2 -2 -4 -3 -4 -4 z" />
        </svg>
      );
    case 'games':
      return (
        <svg {...common}>
          <rect x="8"  y="10" width="32" height="28" rx="3" />
          <line x1="8"  y1="18" x2="40" y2="18" />
          <line x1="14" y1="6"  x2="14" y2="14" />
          <line x1="34" y1="6"  x2="34" y2="14" />
          <line x1="24" y1="22" x2="24" y2="34" />
          <line x1="14" y1="28" x2="34" y2="28" />
        </svg>
      );
    case 'groups':
      return (
        <svg {...common}>
          <circle cx="24" cy="16" r="5" />
          <path d="M14 36 c0 -5 4.5 -9 10 -9 s10 4 10 9" />
          <circle cx="11" cy="20" r="4" />
          <path d="M4 36 c0 -4 3 -7 7 -7" />
          <circle cx="37" cy="20" r="4" />
          <path d="M44 36 c0 -4 -3 -7 -7 -7" />
        </svg>
      );
    case 'community':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="16" />
          <path d="M8 24 h32" />
          <path d="M24 8 c5 4 7 10 7 16 s-2 12 -7 16" />
          <path d="M24 8 c-5 4 -7 10 -7 16 s2 12 7 16" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...common}>
          <line x1="8" y1="40" x2="40" y2="40" />
          <line x1="8" y1="40" x2="8"  y2="8" />
          <polyline points="12 32 20 24 26 28 36 14" />
          <circle cx="36" cy="14" r="1.5" fill="#1A1A1A" />
        </svg>
      );
    default:
      return null;
  }
}

function LangSwitch({ lang, onChange }) {
  const cls = (active) =>
    `text-xs font-bold tracking-[0.15em] transition ${
      active ? 'text-ink' : 'text-muted hover:text-ink'
    }`;
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={cls(lang === 'de')} onClick={() => onChange('de')} aria-pressed={lang === 'de'}>DE</button>
      <span className="text-line">|</span>
      <button type="button" className={cls(lang === 'en')} onClick={() => onChange('en')} aria-pressed={lang === 'en'}>EN</button>
    </div>
  );
}

const MOCKUPS = [
  '/mockup-1.png?v=2',
  '/mockup-2.png?v=2',
  '/mockup-3.png?v=2',
  '/mockup-4.png?v=2',
  '/mockup-5.png?v=2',
];

function MockupCarousel() {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (hovering) return;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % MOCKUPS.length);
    }, 5000);
    return () => clearTimeout(timerRef.current);
  }, [index, hovering]);

  const prev = () => setIndex((i) => (i - 1 + MOCKUPS.length) % MOCKUPS.length);
  const next = () => setIndex((i) => (i + 1) % MOCKUPS.length);

  return (
    <div
      className="relative w-full max-w-[760px] mx-auto"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Previous"
          onClick={prev}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-ink opacity-40 hover:opacity-90 transition"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex-1 max-w-[560px] overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {MOCKUPS.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Matchup screen ${i + 1}`}
                className="w-full shrink-0 h-auto object-contain"
                draggable={false}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next"
          onClick={next}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-ink opacity-40 hover:opacity-90 transition"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {MOCKUPS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition ${
              i === index ? 'bg-ink' : 'bg-[#D0D0D0] hover:bg-[#999]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const APP_STORE_URL =
  'https://apps.apple.com/us/app/matchup-app/id6764099315';

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = COPY[lang];

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      {/* Navbar */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 select-none">
            <img src="/logo.png" alt="" className="h-10 sm:h-11 w-auto" draggable={false} />
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">Matchup</span>
          </a>
          <LangSwitch lang={lang} onChange={setLang} />
        </div>
      </header>

      {/* Hero — centered, with 3D balls in the background */}
      <section className="relative">
        <TennisBalls3D />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted font-semibold mb-6">
            {t.eyebrow}
          </p>
          <h1 className="text-6xl sm:text-7xl lg:text-[92px] font-extrabold leading-[1.02] tracking-tight">
            {t.title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed">
            {t.tagline}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 bg-ink text-white text-sm font-semibold px-6 py-3.5 rounded-full hover:opacity-90 transition"
            >
              <AppleGlyph />
              {t.appStore}
            </a>
            <a
              href="/matchup.apk"
              download
              className="inline-flex items-center justify-center gap-2.5 border border-line bg-white text-sm font-semibold px-6 py-3.5 rounded-full hover:border-ink transition"
            >
              <AndroidGlyph />
              {t.androidDownload}
            </a>
          </div>

          <div className="mt-16">
            <MockupCarousel />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 border-t border-line">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
            {t.featuresTitle}
          </h2>
          <p className="text-muted mt-3 max-w-2xl mx-auto text-center">
            {t.featuresSubtitle}
          </p>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14 text-center">
            {t.features.map((f) => (
              <div key={f.key} className="flex flex-col items-center px-2">
                <FeatureIcon kind={f.key} />
                <h3 className="mt-5 text-[18px] font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-[14px] text-muted leading-relaxed max-w-xs">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="px-6 py-24 bg-[#FAFAFA] border-t border-line">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-muted mt-4 max-w-xl mx-auto">{t.ctaBody}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-ink text-white text-sm font-semibold px-6 py-3.5 rounded-full hover:opacity-90 transition"
            >
              <AppleGlyph />
              {t.appStore}
            </a>
            <a
              href="/matchup.apk"
              download
              className="inline-flex items-center gap-2.5 border border-line bg-white text-sm font-semibold px-6 py-3.5 rounded-full hover:border-ink transition"
            >
              <AndroidGlyph />
              {t.androidDownload}
            </a>
          </div>
          <p className="mt-6 text-xs text-muted">
            {t.ctaContact}{' '}
            <a href="mailto:wiederhold.martin@web.de" className="underline hover:text-ink">
              wiederhold.martin@web.de
            </a>
          </p>
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
