import Footer from '../components/Footer.jsx';

const features = [
  {
    title: 'Spielpartner finden',
    body: 'Spieler:innen in deiner Nähe — gefiltert nach Sport, Niveau und Club.',
  },
  {
    title: 'Offene Spiele',
    body: 'Plane Matches oder tritt offenen Partien bei — Einzel oder Doppel.',
  },
  {
    title: 'Community',
    body: 'Folge anderen Spieler:innen, schreibe Posts und plane das nächste Match.',
  },
  {
    title: 'Clubs & Gruppen',
    body: 'Verbinde dich mit deinem Heimclub und tritt thematischen Gruppen bei.',
  },
];

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

/// Outline-style Android robot icon (Lucide-inspired).
function AndroidGlyph(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className ?? 'w-5 h-5'}
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="9" cy="15" r="1" />
      <circle cx="15" cy="15" r="1" />
      <path d="M3 13h1" />
      <path d="M20 13h1" />
      <path d="M7 3l1.5 3" />
      <path d="M17 3l-1.5 3" />
    </svg>
  );
}

/// Subtle background: a tennis ball flies along a dashed bezier curve.
/// `href` + `xlinkHref` are both set so it works in older Safari and modern
/// Chrome alike (some engines have dropped xlink:* support).
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

// Bumped per-deploy cache-buster so updates always pull a fresh asset
// even when CDN/browser caches think the URL is unchanged.
const SCREENSHOT_SRC = '/app-screenshot.jpg?v=4';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      {/* Navbar */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight">Matchup</span>
          <a
            href="#download"
            className="text-sm font-semibold bg-ink text-white px-4 py-2 rounded-full hover:opacity-90 transition"
          >
            Download
          </a>
        </div>
      </header>

      {/* Hero — text left, mockup right */}
      <section className="relative px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <TennisBallBackdrop />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-muted font-semibold mb-5">
              Tennis · Padel · Schweiz
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight">
              Matchup
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl lg:max-w-none leading-relaxed mx-auto lg:mx-0">
              Finde deinen perfekten Spielpartner.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-start items-stretch sm:justify-start justify-center">
              <a
                href="#download"
                className="inline-flex items-center justify-center gap-2.5 bg-ink text-white text-sm font-semibold px-6 py-3.5 rounded-full hover:opacity-90 transition"
              >
                <AppleGlyph />
                App Store · bald
              </a>
              <a
                href="/matchup.apk"
                download
                className="inline-flex items-center justify-center gap-2.5 border border-line bg-white text-sm font-semibold px-6 py-3.5 rounded-full hover:border-ink transition"
              >
                <AndroidGlyph />
                Android Download
              </a>
            </div>
          </div>

          {/* Mockup — wider white inner ring for a real-iPhone look */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-[60px] blur-3xl opacity-20 bg-ink"
              />
              <div className="relative w-[260px] sm:w-[300px] aspect-[9/19.5] rounded-[48px] bg-ink p-[10px] shadow-2xl shadow-black/30 ring-1 ring-black/5">
                <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-28 h-6 rounded-full bg-ink z-10" />
                <div className="w-full h-full rounded-[40px] bg-white p-[7px]">
                  <img
                    src={SCREENSHOT_SRC}
                    alt="Matchup App"
                    className="w-full h-full object-cover rounded-[34px]"
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
            Alles für dein nächstes Match.
          </h2>
          <p className="text-muted mt-3 max-w-2xl mx-auto text-center">
            Vom ersten Like bis zum Spiel — Matchup begleitet dich durch jeden Schritt.
          </p>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
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
            Bereit zu spielen?
          </h2>
          <p className="text-muted mt-4 max-w-xl mx-auto">
            Matchup startet bald im App Store. Android-User können die App schon jetzt
            direkt herunterladen.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2.5 bg-ink text-white text-sm font-semibold px-6 py-3.5 rounded-full">
              <AppleGlyph />
              App Store · bald
            </span>
            <a
              href="/matchup.apk"
              download
              className="inline-flex items-center gap-2.5 border border-line bg-white text-sm font-semibold px-6 py-3.5 rounded-full hover:border-ink transition"
            >
              <AndroidGlyph />
              Android Download
            </a>
          </div>
          <p className="mt-6 text-xs text-muted">
            Beta-Zugang oder Fragen?{' '}
            <a
              href="mailto:wiederhold.martin@web.de"
              className="underline hover:text-ink"
            >
              wiederhold.martin@web.de
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
