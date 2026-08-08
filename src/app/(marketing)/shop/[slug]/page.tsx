import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getProduct, productSub } from "@/components/shop/products";
import ProductDetail from "@/components/shop/ProductDetail";

// Next 16: `params` ist ein Promise → await. Kein „— Matchup"-Suffix (Root-Layout hängt es an).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const t = await getT();
  const title = `${p.brand} ${p.name}`;
  return {
    title,
    description: productSub(p, t) || title,
    alternates: { canonical: `/shop/${p.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  // Warenkorb-Provider + Drawer kommen aus dem Shop-Layout — diese Seite legt nur hinein.
  return <ProductDetail product={product} />;
}
