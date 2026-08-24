import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Tour2Subpage from "../components/Tour2Subpage";
import FormView from "./FormView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.formSeoTitle"),
    description: t("tour.formSeoDescription"),
    alternates: { canonical: "/tour2/form" },
    robots: { index: false, follow: false },
  };
}

export default async function FormPage() {
  const t = await getT();
  return (
    <Tour2Subpage title={t("tour.formTitle")} subtitle={t("tour.formSubtitle")}>
      <FormView />
    </Tour2Subpage>
  );
}
