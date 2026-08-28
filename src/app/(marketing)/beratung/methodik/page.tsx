import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { RULES_VERSION } from "@/domain/recommendations/scoreV1";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: `${t("beratung.methodikTitle")} · Matchup`,
    description: t("beratung.methodikSub"),
    alternates: { canonical: "/beratung/methodik" },
    openGraph: {
      url: "/beratung/methodik",
      title: t("beratung.methodikTitle"),
      description: t("beratung.methodikSub"),
      images: ["/icon-512.png"],
    },
  };
}

export default async function MethodikPage() {
  const t = await getT();
  const sections = [
    { title: t("beratung.m1Title"), body: t("beratung.m1Body") },
    { title: t("beratung.m2Title"), body: t("beratung.m2Body") },
    { title: t("beratung.m3Title"), body: t("beratung.m3Body") },
    { title: t("beratung.m4Title"), body: t("beratung.m4Body") },
  ];

  return (
    <main className="mx-auto max-w-[720px] px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-matchup">Matchup Advice</p>
      <h1 className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
        {t("beratung.methodikTitle")}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-neutral-500">{t("beratung.methodikSub")}</p>

      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={i} className="border-t border-black/[0.08] pt-8">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-matchup/10 text-[13px] font-extrabold text-matchup">{i + 1}</span>
              <div>
                <h2 className="text-[20px] font-extrabold tracking-tight text-neutral-900">{s.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-2xl bg-black/[0.035] px-5 py-4 text-[13px] font-semibold text-neutral-500">
        {t("beratung.methodikVersion", { v: RULES_VERSION })}
      </p>

      <Link href="/beratung" className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700">
        ← {t("beratung.methodikBack")}
      </Link>
    </main>
  );
}
