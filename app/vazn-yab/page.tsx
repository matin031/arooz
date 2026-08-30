import VaznYabSection from "@/components/UI/guide/VaznYabSection";
import VaznYabHero3D from "@/components/UI/vazn-yab/VaznYabHero3D";

function page() {
  return (
    <div dir="rtl" className="container relative z-20">
      <VaznYabHero3D />

      <VaznYabSection />
    </div>
  );
}

export default page;
