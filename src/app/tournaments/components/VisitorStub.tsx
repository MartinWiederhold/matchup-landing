import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/** Platzhalter, bis der Besucher-Aufbau feststeht. */
export default async function VisitorStub() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-[640px] px-5 py-12">
      <p className="t2-eyebrow">{t("tournaments.brand")}</p>
      <h1 className="mt-3 t2-display t2-fs-display">{t("tournaments.stubTitle")}</h1>
      <p className="mt-3 t2-fs-body text-[var(--t2-text-muted)]">{t("tournaments.stubLead")}</p>
      <Link href="/tournaments" className="mt-8 inline-flex t2-cta">{t("tournaments.stubBack")}</Link>
    </div>
  );
}
