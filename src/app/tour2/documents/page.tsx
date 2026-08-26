import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import DocumentsView from "./DocumentsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("tour.t2navDocs"),
    description: t("tour.t2docsLead"),
    alternates: { canonical: "/tour2/documents" },
    robots: { index: false, follow: false },
  };
}

export default function DocumentsPage() {
  return <DocumentsView />;
}
