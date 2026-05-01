import { useState } from 'react';
import Footer from '../components/Footer.jsx';

const COPY = {
  en: {
    eyebrow: 'TENNIS · PADEL · SWITZERLAND',
    title: 'Matchup',
    tagline: 'Find your perfect playing partner.',
    appStore: 'App Store',
    androidDownload: 'Android Download',
    download: 'Download',
    featuresTitle: 'Everything for your next match.',
    featuresSubtitle:
      'From the first like to game time — Matchup walks with you every step.',
    features: [
      {
        title: 'Find a partner',
        body:
          'Players near you — filtered by sport, level and club.',
      },
      {
        title: 'Open matches',
        body:
          'Schedule games or join open matches — singles or doubles.',
      },
      {
        title: 'Community',
        body:
          'Follow other players, post updates and plan your next match.',
      },
      {
        title: 'Clubs & groups',
        body:
          'Connect with your home club and join themed groups.',
      },
    ],
    ctaTitle: 'Ready to play?',
    ctaBody:
      'Matchup is launching on the App Store soon. Android users can download the app directly today.',
    ctaContact: 'Beta access or questions?',
  },
  de: {
    eyebrow: 'TENNIS · PADEL · SCHWEIZ',
    title: 'Matchup',
    tagline: 'Finde deinen perfekten Spielpartner.',
    appStore: 'App Store',
    androidDownload: 'Android Download',
    download: 'Download',
    featuresTitle: 'Alles für dein nächstes Match.',
    featuresSubtitle:
      'Vom ersten Like bis zum Spiel — Matchup begleitet dich durch jeden Schritt.',
    features: [
      {
        title: 'Spielpartner finden',
        body:
          'Spieler:innen in deiner Nähe — gefiltert nach Sport, Niveau und Club.',
      },
      {
        title: 'Offene Spiele',
        body:
          'Plane Matches oder tritt offenen Partien bei — Einzel oder Doppel.',
      },
      {
        title: 'Community',
        body:
          'Folge anderen Spieler:innen, schreibe Posts und plane das nächste Match.',
      },
      {
        title: 'Clubs & Gruppen',
        body:
          'Verbinde dich mit deinem Heimclub und tritt thematischen Gruppen bei.',
      },
    ],
    ctaTitle: 'Bereit zu spielen?',
    ctaBody:
      'Matchup startet bald im App Store. Android-User können die App schon jetzt direkt herunterladen.',
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

/// Classic Android robot — body, antennas, eyes (Material-style filled).
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

function TennisBallBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <svg
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <path
          id="ballPath"
          d="M -80 520 Q 350 60 1280 30"
          stroke="#1A1A1A"
          strokeWidth="1.4"
          strokeDasharray="6 9"
          fill="none"
          opacity="0.08"
        />
        <g opacity="0.18">
          <circle cx="0" cy="0" r="14" fill="#D7E84F" />
          <path
            d="M -11 -3 Q 0 -12 11 -3"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M -11 4 Q 0 13 11 4"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <animateMotion
            dur="8s"
            repeatCount="indefinite"
            rotate="auto"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.42 0 0.58 1"
          >
            <mpath href="#ballPath" xlinkHref="#ballPath" />
          </animateMotion>
        </g>
      </svg>
    </div>
  );
}

function LangSwitch({ lang, onChange }) {
  const cls = (active) =>
    `text-xs font-bold tracking-[0.15em] transition ${
      active ? 'text-ink' : 'text-muted hover:text-ink'
    }`;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={cls(lang === 'de')}
        onClick={() => onChange('de')}
        aria-pressed={lang === 'de'}
      >
        DE
      </button>
      <span className="text-line">|</span>
      <button
        type="button"
        className={cls(lang === 'en')}
        onClick={() => onChange('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}

const SCREENSHOT_SRC = '/app-screenshot.jpg?v=5';
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
          <span className="text-xl font-extrabold tracking-tight">Matchup</span>
          <div className="flex items-center gap-5">
            <LangSwitch lang={lang} onChange={setLang} />
            <a
              href="#download"
              className="text-sm font-semibold bg-ink text-white px-4 py-2 rounded-full hover:opacity-90 transition"
            >
              {t.download}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <TennisBallBackdrop />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-muted font-semibold mb-5">
              {t.eyebrow}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight">
              {t.title}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl lg:max-w-none leading-relaxed mx-auto lg:mx-0">
              {t.tagline}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-start items-stretch sm:justify-start justify-center">
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
          </div>

          {/* Mockup — object-contain so the screenshot is fully visible */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-[60px] blur-3xl opacity-20 bg-ink"
              />
              <div className="relative w-[260px] sm:w-[300px] aspect-[9/19.5] rounded-[48px] bg-ink p-[10px] shadow-2xl shadow-black/30 ring-1 ring-black/5">
                <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-28 h-6 rounded-full bg-ink z-10" />
                <div className="w-full h-full rounded-[40px] bg-white p-[10px] flex items-center justify-center">
                  <img
                    src={SCREENSHOT_SRC}
                    alt="Matchup App"
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-[30px]"
                  />
                </div>
              </div>
            </div>
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
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.map((f, i) => (
              <div key={f.title}>
                <div className="text-xs font-bold tracking-[0.2em] text-muted">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{f.body}</p>
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
            <a
              href="mailto:wiederhold.martin@web.de"
              className="underline hover:text-ink"
            >
              wiederhold.martin@web.de
            </a>
          </p>
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
