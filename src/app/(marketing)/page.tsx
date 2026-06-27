import Hero from "@/components/Hero";
import HealthStats from "@/components/HealthStats";
import CompletePicture from "@/components/CompletePicture";
import Memberships from "@/components/Memberships";
import Partners from "@/components/Partners";
import Showcase from "@/components/Showcase";
import CtaBanner from "@/components/CtaBanner";

export default function Home() {
  return (
    <>
      <Hero />
      <HealthStats />
      <CompletePicture />
      <Memberships />
      <Partners />
      <Showcase />
      <CtaBanner />
    </>
  );
}
