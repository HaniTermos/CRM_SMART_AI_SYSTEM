import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Sparkles, TrendingUp, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

import { CircularBadge } from './CircularBadge';
import { SpecularButton } from './SpecularButton';
import { ParticleField } from './ParticleField';
import { ColorBends } from './ColorBends';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function HeroSection() {
  const pinRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineGroupRef = useRef<HTMLDivElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const metricsGroupRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const colorBendsRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  useEffect(() => {
    const pinEl = pinRef.current;
    if (!pinEl) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinEl,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onEnterBack: () => {
            // Full state restoration on reverse scroll
            gsap.to([headlineGroupRef.current, ctaGroupRef.current, metricsGroupRef.current, badgeRef.current], {
              opacity: 1, scale: 1, y: 0, duration: 0.3, overwrite: true,
            });
            gsap.to([colorBendsRef.current, particleRef.current], { opacity: 1, scale: 1, duration: 0.3, overwrite: true });
            gsap.to(scrollIndicatorRef.current, { opacity: 1, duration: 0.2, overwrite: true });
          },
        },
      });

      // ═══════════════════════════════════════════════════════════
      // BAND 1 (0.00 → 0.25): INTRO — Steady state, content visible
      // ═══════════════════════════════════════════════════════════
      // Nothing animates here — the viewer absorbs the hero layout.

      // ═══════════════════════════════════════════════════════════
      // BAND 2 (0.25 → 0.50): PARALLAX BUILD — Content compresses upward
      // ═══════════════════════════════════════════════════════════
      tl.to(headlineGroupRef.current, { y: -15, ease: 'power1.out', duration: 0.25 }, 0.25);
      tl.to(scrollIndicatorRef.current, { opacity: 0, y: -10, duration: 0.15 }, 0.25);

      // ═══════════════════════════════════════════════════════════
      // BAND 3 (0.50 → 0.75): BUILD-UP — ColorBends intensity rises, content starts forward push
      // ═══════════════════════════════════════════════════════════
      tl.to(headlineGroupRef.current, { scale: 1.06, y: -30, ease: 'power1.in', duration: 0.25 }, 0.50);
      tl.to([ctaGroupRef.current, metricsGroupRef.current], { y: -20, opacity: 0.7, duration: 0.25 }, 0.55);
      tl.to(colorBendsRef.current, { scale: 1.08, duration: 0.25 }, 0.50);

      // ═══════════════════════════════════════════════════════════
      // BAND 4 (0.75 → 1.00): MORPH — "Going Through" forward depth tunnel push
      //   Hero text, CTA, metrics, particles all zoom forward and dissolve.
      //   ColorBends expands outward like the camera is flying through it.
      // ═══════════════════════════════════════════════════════════
      tl.to(
        headlineGroupRef.current,
        { scale: 1.3, y: -70, opacity: 0, ease: 'power2.in', duration: 0.25 },
        0.75
      );
      tl.to(
        [ctaGroupRef.current, metricsGroupRef.current, badgeRef.current],
        { scale: 1.2, y: -50, opacity: 0, ease: 'power2.in', stagger: 0.03, duration: 0.22 },
        0.78
      );
      tl.to(colorBendsRef.current, { opacity: 0, scale: 1.4, ease: 'power2.in', duration: 0.25 }, 0.75);
      tl.to(particleRef.current, { opacity: 0, scale: 1.5, ease: 'power2.in', duration: 0.2 }, 0.80);

    }, pinEl);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pinRef} id="hero" className="relative min-h-screen bg-transparent z-10">
      {/* React Bits Background Studio: ColorBends Canvas Field */}
      <div ref={colorBendsRef} className="absolute inset-0 origin-center">
        <ColorBends
          rotation={90}
          speed={0.75}
          colors={['#CF00FF', '#00E0FF', '#03CF94']}
          transparent={true}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          intensity={1.5}
          bandWidth={6}
          opacity={1}
        />
      </div>

      {/* Particle Field */}
      <div ref={particleRef} className="absolute inset-0 origin-center">
        <ParticleField />
      </div>

      <section
        ref={contentRef}
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        className="relative h-screen flex flex-col justify-between pt-28 pb-12 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden z-10"
      >
        {/* Top Pill Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="self-start inline-flex items-center gap-2 px-4 py-1.5 rounded-full white-glass-panel text-xs font-semibold text-[#190E85] shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00E0FF]" />
          <span className="font-mono-metrics tracking-widest uppercase">The Autonomous Commerce Platform</span>
        </motion.div>

        {/* Center Main Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
          {/* Left: Manrope Headline & Specular CTA */}
          <div ref={headlineGroupRef} className="lg:col-span-8 origin-center">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-[-0.03em] text-[#190E85] leading-[1.05] mb-6">
              <div className="block overflow-hidden">
                <motion.span
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block"
                >
                  Commerce
                </motion.span>
              </div>
              <div className="block overflow-hidden pb-2">
                <motion.span
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block text-[#190E85]"
                >
                  Reimagined by{' '}
                  <span className="font-serif-italic font-normal text-gradient-neon drop-shadow-[0_0_28px_rgba(0,224,255,0.45)]">
                    AI
                  </span>
                </motion.span>
              </div>
            </h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg md:text-xl text-[#0F172A]/60 max-w-xl mb-10 leading-relaxed font-normal"
            >
              The multi-tenant e-commerce engine that thinks, predicts, and closes deals for you. Gemini-driven demand scoring meets high-velocity sales pipelines.
            </motion.p>

            <div ref={ctaGroupRef} className="origin-left">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                className="flex flex-wrap items-center gap-4"
              >
                <SpecularButton href="/dashboard" variant="primary">
                  <span>Start building free</span>
                  <ArrowRight className="w-4 h-4" />
                </SpecularButton>
                <SpecularButton href="#features" variant="outline">
                  <span>Explore Capabilities</span>
                </SpecularButton>
              </motion.div>
            </div>
          </div>

          {/* Right: Badge + Metrics */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center space-y-6">
            <motion.div
              ref={badgeRef}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="origin-center"
            >
              <CircularBadge isHovered={isHeroHovered} />
            </motion.div>

            <motion.div
              ref={metricsGroupRef}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-full max-w-xs space-y-3"
            >
              <div className="white-glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#190E85]/10 flex items-center justify-center text-[#190E85]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#190E85] tabular-nums">10k+ Merchants</div>
                  <div className="text-xs text-slate-500 font-mono-metrics">Active Multi-Tenant Stores</div>
                </div>
              </div>
              <div className="white-glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#00E0FF]/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#00E0FF]" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#190E85] tabular-nums">98.4% Accuracy</div>
                  <div className="text-xs text-slate-500 font-mono-metrics">Gemini Demand Scoring</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          ref={scrollIndicatorRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="self-center flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#190E85] transition-colors"
        >
          <span className="font-mono-metrics text-[10px] uppercase tracking-widest font-semibold">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#00E0FF]" />
        </motion.div>
      </section>
    </div>
  );
}
