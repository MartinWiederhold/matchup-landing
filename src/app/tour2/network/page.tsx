import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import NetworkView from "./NetworkView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navNetwork"),
    description: t("tour.t2netLead"),
    alternates: { canonical: "/tour2/network" },
    robots: { index: false, follow: false },
  };
}

export default function NetworkPage() {
  return <NetworkView />;
}
