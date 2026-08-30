import FeaturesSection from "@/components/UI/FeaturesSection";
import HeroSection from "@/components/UI/HeroSection";
import LearningProcessSection from "@/components/UI/LearningProcessSection";
import StartLearningSection from "@/components/UI/StartLearningSection";
import VerseCard from "@/components/UI/WaveDivider";
import VaznYabHomeSection from "@/components/UI/VaznYabHomeSection";
import OrouzHomeSection from "@/components/UI/OrouzHomeSection";

export default function Home() {
  return (
    <div className="relative bg-background overflow-hidden">
      <main className="space-y-30 pb-22">
        <section
          className="container text-center flex items-center justify-center flex-col px-6  
        md:px-12 lg:px-20 py-14 relative"
        >
          <div className="hidden dark:block  bg-primary/8 blur-3xl size-100 rounded-full right-20 bottom-0 absolute"></div>
          <HeroSection />
        </section>
        <section className="container pb-24">
          <VerseCard />
        </section>
        <section className="container">
          <FeaturesSection />
        </section>
        <section className="container relative">
          <VaznYabHomeSection />
        </section>
        <section className="container relative pb-22">
          <OrouzHomeSection />
        </section>
        <section>
          <LearningProcessSection />
        </section>
        <section className=" container z-10 relative pb-22">
          <StartLearningSection />
        </section>
      </main>
    </div>
  );
}
