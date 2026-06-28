import PromoBar from "@/components/PromoBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PromoBar />
      <Header />
      <main className="flex-1 bg-white">{children}</main>
      <Footer />
    </>
  );
}
