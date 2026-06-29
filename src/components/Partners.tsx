import Image from "next/image";
import { getT } from "@/lib/i18n/server";

export default async function Partners() {
  const t = await getT();
  return (
    <section id="warum-matchup" className="relative isolate overflow-hidden bg-black text-white">
      <Image
        src="/landing/partners.png"
        alt="MATCHUP Athlet"
        fill
        sizes="100vw"
        className="object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-[1280px] flex-col justify-end px-4 py-20 sm:px-6 lg:px-12">
        <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-6xl">
          {t("landing.partnersTitle")}
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
          {t("landing.partnersCopy")}
        </p>
        <div className="mt-10">
          <a
            href="/app"
            className="inline-block rounded-full bg-white px-8 py-4 text-sm font-bold tracking-wide text-black transition-colors hover:bg-white/85"
          >
            {t("landing.partnersCta")}
          </a>
        </div>
      </div>
    </section>
  );
}
