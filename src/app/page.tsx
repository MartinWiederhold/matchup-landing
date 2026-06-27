import PromoBar from "@/components/PromoBar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HealthStats from "@/components/HealthStats";
import CompletePicture from "@/components/CompletePicture";
import Memberships from "@/components/Memberships";
import Partners from "@/components/Partners";
import Showcase from "@/components/Showcase";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <PromoBar />
      <Header />
      <main className="flex-1">
        <Hero />
        <HealthStats />
        <CompletePicture />
        <Memberships />
        <Partners />
        <Showcase />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
