import Footer from '../components/Footer.jsx';

const features = [
  {
    icon: '👥',
    title: 'Spielpartner finden',
    body: 'Entdecke Spieler:innen in deiner Nähe — gefiltert nach Sport, Spielstärke und Club.',
  },
  {
    icon: '🎾',
    title: 'Offene Spiele',
    body: 'Stelle Spiele ein oder tritt offenen Matches bei — egal ob Einzel oder Doppel.',
  },
  {
    icon: '💬',
    title: 'Community Chats',
    body: 'Schreibe direkt mit gematchten Spieler:innen und plane das nächste Match.',
  },
  {
    icon: '🏆',
    title: 'Clubs & Gruppen',
    body: 'Verbinde dich mit deinem Heimclub und tritt thematischen Gruppen bei.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      {/* Navbar */}
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight">
            Matchup<span className="text-ink">.</span>
          </span>
          <a
            href="#download"
            className="text-sm font-semibold bg-ink text-white px-4 py-2 rounded-full hover:opacity-90 transition"
          >
            Download
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted font-semibold mb-4">
              Tennis · Padel · Community
            </p>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Finde deinen{' '}
              <span className="italic font-extrabold">perfekten</span> Spielpartner.
            </h1>
            <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
              Matchup verbindet Tennis- und Padel-Spieler:innen in der Schweiz. Plane
              Spiele, finde Mitspieler und werde Teil einer aktiven Community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#download"
                className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-6 py-3 rounded-full hover:opacity-90 transition"
              >
                App Store · bald
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 border border-line text-sm font-semibold px-6 py-3 rounded-full hover:border-ink transition"
              >
                Mehr erfahren
              </a>
            </div>
          </div>

          {/* Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-[260px] sm:w-[300px] aspect-[9/19] rounded-[44px] bg-ink p-3 shadow-2xl shadow-black/20">
              <div className="w-full h-full rounded-[34px] bg-white overflow-hidden flex flex-col">
                <div className="px-5 pt-8 pb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted font-semibold">
                    Entdecken
                  </p>
                  <h3 className="text-2xl font-extrabold mt-1">
                    Lena, 26
                  </h3>
                </div>
                <div className="mx-5 rounded-2xl bg-line aspect-[4/5] flex items-center justify-center text-5xl">
                  🎾
                </div>
                <div className="px-5 mt-4 space-y-2 flex-1">
                  <div className="rounded-xl bg-[#F8F8F8] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                      Was ich suche
                    </p>
                    <p className="text-sm font-bold mt-1">Doppelpartner für Sonntags</p>
                  </div>
                  <div className="flex gap-2 text-[11px] text-muted">
                    <span className="rounded-full border border-line px-2 py-1">
                      📍 Zürich
                    </span>
                    <span className="rounded-full border border-line px-2 py-1">
                      🎾 Tennis
                    </span>
                  </div>
                </div>
                <div className="m-5 rounded-full bg-ink h-12 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">Match anfragen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-[#FAFAFA] border-y border-line">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Alles für dein nächstes Match.
          </h2>
          <p className="text-muted mt-3 max-w-2xl">
            Vom ersten Like bis zum Spiel — Matchup begleitet dich durch jeden Schritt.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white border border-line p-6 hover:border-ink transition"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Bereit zu spielen?
          </h2>
          <p className="text-muted mt-4 max-w-xl mx-auto">
            Matchup startet bald im App Store. Trage dich ein und sei einer der ersten
            Spieler:innen.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-6 py-3 rounded-full">
               · Bald im App Store
            </span>
            <span className="inline-flex items-center gap-2 border border-line text-sm font-semibold px-6 py-3 rounded-full text-muted">
              Android APK auf Anfrage
            </span>
          </div>
          <p className="mt-6 text-xs text-muted">
            Schreibe an{' '}
            <a
              href="mailto:wiederhold.martin@web.de"
              className="underline hover:text-ink"
            >
              wiederhold.martin@web.de
            </a>{' '}
            für Beta-Zugang.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
