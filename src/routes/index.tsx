import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { PageLoader } from "../components/homepage/PageLoader";
import { HeroSection } from "../components/homepage/HeroSection";
import { MagicBento } from "../components/homepage/MagicBento";
import { HorizontalGallery } from "../components/homepage/HorizontalGallery";
import { CurvedLoop } from "../components/homepage/CurvedLoop";
import { PricingFlipCards } from "../components/homepage/PricingFlipCards";
import { FAQSection } from "../components/homepage/FAQSection";
import { useSmoothScroll, getLenis } from "../hooks/useSmoothScroll";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [loaded, setLoaded] = useState(false);
  useSmoothScroll();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  const handleLoaderComplete = () => {
    window.scrollTo(0, 0);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    setLoaded(true);
  };

  return (
    <>
      <AnimatePresence>
        {!loaded && <PageLoader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
        <HeroSection />
        <MagicBento />
        <HorizontalGallery />
        <CurvedLoop />
        <PricingFlipCards />
        <FAQSection />
      </main>
    </>
  );
}
