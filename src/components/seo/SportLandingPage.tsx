import Image from "next/image";

export type SportLanding = {
  slug: string;
  sport: string; // "Tennis"
  partnerWord: string; // "Tennispartner"
  h1: string;
  intro: string;
  heroImg: string;
  heroPos?: string;
  benefits: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  faq: { q: string; a: string }[];
};

const BASE = "https://matchup-app.com";

export default function SportLandingPage({
  data,
  cityLinks,
}: {
  data: SportLanding;
  cityLinks?: { href: string; name: string }[];
}) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Matchup", item: BASE },
      {
        "@type": "ListItem",
        position: 2,
        name: data.h1,
        item: `${BASE}/${data.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[52vh] items-center overflow-hidden bg-black px-4 py-20 sm:px-6 lg:px-12">
        <Image
          src={data.heroImg}
          alt={data.h1}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
          style={data.heroPos ? { objectPosition: data.heroPos } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="relative mx-auto w-full max-w-[1100px] text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-matchup">
            {data.sport}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.03] tracking-tight sm:text-6xl">
            {data.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {data.intro}
          </p>
          <a
            href="/app"
            className="mt-9 inline-block rounded-full bg-matchup px-10 py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover"
          >
            Jetzt {data.partnerWord} finden
          </a>
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            In 3 Schritten zum {data.partnerWord}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {data.steps.map((s, i) => (
              <div key={s.title} className="rounded-3xl border border-neutral-200 p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vorteile */}
      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Warum Matchup für {data.sport}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {data.benefits.map((b) => (
              <div key={b.title} className="rounded-3xl bg-white p-7 ring-1 ring-black/5">
                <h3 className="text-lg font-bold tracking-tight">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[820px]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Häufige Fragen
          </h2>
          <div className="mt-8 divide-y divide-neutral-200">
            {data.faq.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer list-none text-base font-semibold tracking-tight">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Beliebte Städte (interne Verlinkung) */}
      {cityLinks && cityLinks.length > 0 && (
        <section className="bg-neutral-50 px-4 py-16 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {data.partnerWord} finden nach Stadt
            </h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {cityLinks.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-black hover:text-black"
                >
                  {data.sport} {c.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-matchup px-4 py-20 text-center text-white sm:px-6 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Finde deinen {data.partnerWord}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85">
            Erstelle dein Profil in unter 3 Minuten — kostenlos.
          </p>
          <a
            href="/app"
            className="mt-8 inline-block rounded-full bg-white px-10 py-4 text-sm font-bold tracking-wide text-matchup transition-opacity hover:opacity-90"
          >
            Kostenlos starten
          </a>
        </div>
      </section>
    </>
  );
}
