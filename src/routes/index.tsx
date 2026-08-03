import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";

import { PageLoader } from "../components/homepage/PageLoader";
import { SplashCursor } from "../components/homepage/SplashCursor";
import { Navbar } from "../components/Navbar";
import { HeroSection } from "../components/homepage/HeroSection";
import { MagicBento } from "../components/homepage/MagicBento";
import { HorizontalGallery } from "../components/homepage/HorizontalGallery";
import { CurvedLoop } from "../components/homepage/CurvedLoop";
import { PricingFlipCards } from "../components/homepage/PricingFlipCards";
import { FAQSection } from "../components/homepage/FAQSection";
import { FooterSection } from "../components/homepage/FooterSection";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [loaded, setLoaded] = useState(false);
  useSmoothScroll();

  return (
    <>
      <AnimatePresence>
        {!loaded && <PageLoader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <>
          <SplashCursor
            SIM_RESOLUTION={128}
            DYE_RESOLUTION={1440}
            DENSITY_DISSIPATION={3.5}
            VELOCITY_DISSIPATION={2}
            PRESSURE={0.1}
            CURL={3}
            SPLAT_RADIUS={0.2}
            SPLAT_FORCE={6000}
            COLOR_UPDATE_SPEED={10}
          />

          <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <MagicBento />
            <HorizontalGallery />
            <CurvedLoop />
            <PricingFlipCards />
            <FAQSection />
            <FooterSection />
          </main>
        </>
      )}
    </>
  );
}