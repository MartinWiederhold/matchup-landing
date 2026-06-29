import { getT } from "@/lib/i18n/server";

export default async function CtaBanner() {
  const t = await getT();
  return (
    <section className="bg-matchup px-4 py-24 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t("landing.ctaTitle")}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          {t("landing.ctaCopy")}
        </p>
        <div className="mt-10">
          <a
            href="/app"
            className="inline-block rounded-full bg-white px-10 py-4 text-sm font-bold tracking-wide text-matchup transition-opacity hover:opacity-90"
          >
            {t("landing.ctaButton")}
          </a>
        </div>
      </div>
    </section>
  );
}
