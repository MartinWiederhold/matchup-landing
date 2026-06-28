import type { Metadata } from "next";
import Image from "next/image";
import PageCta from "@/components/PageCta";
import PartnerSteps from "@/components/find-a-partner/PartnerSteps";

export const metadata: Metadata = {
  title: "So findest du deinen Spielpartner — Matchup",
  description:
    "In drei einfachen Schritten zum perfekten Match: Profil erstellen, entdecken & matchen, chatten & spielen.",
};

export default function FindAPartnerPage() {
  return (
    <>
      <section className="relative flex h-[46vh] min-h-[320px] items-center justify-center overflow-hidden">
        <Image
          src="/find-a-partner/partner.jpg"
          alt="Spielpartner finden"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 35%" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            So findest du deinen Spielpartner
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            In drei einfachen Schritten zum perfekten Match.
          </p>
        </div>
      </section>

      <PartnerSteps />

      <PageCta
        title="Bereit?"
        text="Erstelle jetzt dein Profil und finde deinen ersten Spielpartner."
        buttonLabel="Jetzt starten"
        buttonHref="/app"
      />
    </>
  );
}
