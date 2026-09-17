import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/HeroCarousel";
import FloatingCTA from "@/components/FloatingCTA";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Stats from "@/components/sections/Stats";
import AboutDoctor from "@/components/sections/AboutDoctor";
import Services from "@/components/sections/Services";
import Locations from "@/components/sections/Locations";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <HeroCarousel />
        <WhyChooseUs />
        <Stats />
        <AboutDoctor />
        <Services />

        {/* Trust / legacy blurb */}
        <section className="py-20 md:py-28 bg-app">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Two decades of restoring sight,{" "}
                <span className="text-medical-deepteal">brightening thousands of lives</span>
              </h2>
              <p className="mt-6 text-lg text-muted leading-relaxed">
                Vision House was built on a simple promise — accessible, world-class eye care for every
                family in Ranchi. From advanced surgery to everyday check-ups, our team treats every
                patient with the attention and expertise their eyes deserve.
              </p>
            </Reveal>
          </div>
        </section>

        <Locations />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
