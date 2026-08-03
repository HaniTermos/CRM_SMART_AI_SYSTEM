import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Sparkles, Layers, Rocket, Zap, HeartHandshake } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

interface GalleryModule {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  accent: string;
}

const GALLERY_MODULES: GalleryModule[] = [
  {
    id: 'module-1', tag: 'MODULE 01',
    title: 'Autonomous Demand Intelligence', subtitle: 'Zero-risk product discovery',
    description: 'Gemini analyzes search intent, social sentiment, and pricing elasticity to forecast sales volume before manufacturing.',
    icon: Sparkles, accent: '#190E85',
  },
  {
    id: 'module-2', tag: 'MODULE 02',
    title: 'Multi-Tenant Edge Architecture', subtitle: 'Global multi-store orchestration',
    description: 'Deploy hundreds of hyper-localized storefronts from one unified database with domain routing and cart isolation.',
    icon: Layers, accent: '#00E0FF',
  },
  {
    id: 'module-3', tag: 'MODULE 03',
    title: 'Self-Healing CRM Pipeline', subtitle: 'Automated deal closing',
    description: 'Kanban stages update dynamically based on email interactions, store visits, and abandoned cart activity.',
    icon: Rocket, accent: '#CF00FF',
  },
  {
    id: 'module-4', tag: 'MODULE 04',
    title: 'Real-Time Inventory Mesh', subtitle: 'Instant stock synchronization',
    description: 'Never oversell again. Edge functions resolve inventory allocation across multiple fulfillment centers in milliseconds.',
    icon: Zap, accent: '#03CF94',
  },
  {
    id: 'module-5', tag: 'MODULE 05',
    title: 'Hyper-Personalized Checkout', subtitle: 'Dynamic conversion boost',
    description: 'Custom checkout experiences with automatic localized currencies, discount applications, and 1-click buy.',
    icon: HeartHandshake, accent: '#190E85',
  },
];

export function HorizontalGallery() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const portalDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const track = trackRef.current;
    const rail = railRef.current;
    const cardsEl = cardsRef.current;
    const portalDot = portalDotRef.current;
    if (!trigger || !track || !rail || !cardsEl || !portalDot) return;

    const ctx = gsap.context(() => {
      const cards = cardsEl.querySelectorAll('.gallery-card');

      // ═══ ENTRANCE: Rail draws in from left to right, cards snap into place ═══
      gsap.fromTo(rail,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1, opacity: 1, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(cards,
        { x: 80, opacity: 0 },
        {
          x: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger, start: 'top 70%', toggleActions: 'play none none reverse' },
        }
      );

      // ═══ PINNED SCRUBBED HORIZONTAL MOVEMENT + PORTAL EXIT ═══
      const scrollWidth = track.scrollWidth - window.innerWidth;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${scrollWidth + 400}`,
          invalidateOnRefresh: true,
          onEnterBack: () => {
            // Restore all visibility when scrolling back up
            gsap.to(cards, { opacity: 1, scale: 1, y: 0, duration: 0.3, overwrite: true });
            gsap.to(rail, { opacity: 1, scaleX: 1, duration: 0.3, overwrite: true });
            gsap.to(portalDot, { opacity: 0, scale: 0, duration: 0.2, overwrite: true });
          },
        },
      });

      // Stage 1 (0 → 0.80): Horizontal rail scroll
      tl.to(track, { x: -scrollWidth, ease: 'none', duration: 0.8 });

      // Stage 2 (0.80 → 1.00): PORTAL COLLAPSE — all scrubbed so reverse scroll works
      tl.to(cards, { scale: 0.15, opacity: 0, y: 30, stagger: 0.02, ease: 'power2.in', duration: 0.12 }, 0.80);
      tl.to(rail, { scaleX: 0.05, opacity: 0.15, ease: 'power2.in', duration: 0.12 }, 0.82);
      tl.to(portalDot, { scale: 3, opacity: 1, ease: 'back.out(2)', duration: 0.08 }, 0.90);
      tl.to(portalDot, { scale: 0, opacity: 0, duration: 0.08 }, 0.96);

    }, trigger);

    return () => ctx.revert();
  }, []);

  return (
    <section id="gallery" ref={triggerRef} className="relative overflow-hidden bg-[#F9FAFB] z-10">
      {/* Electric Royal Rail Line */}
      <div
        ref={railRef}
        className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#190E85]/50 to-transparent pointer-events-none z-0"
        style={{ transformOrigin: 'left center', transform: 'scaleX(0)' }}
      />

      {/* Portal Collapse Dot (Center of Rail) */}
      <div
        ref={portalDotRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-[#190E85] via-[#00E0FF] to-[#CF00FF] shadow-[0_0_40px_#00E0FF] pointer-events-none opacity-0 z-20"
      />

      <div className="h-screen flex items-center">
        <div ref={trackRef} className="flex gap-8 px-12 md:px-24 items-center w-max z-10">
          <div ref={cardsRef} className="flex gap-8 items-center">
            {/* Header Card */}
            <div className="w-[85vw] sm:w-[380px] shrink-0 pr-6 gallery-card">
              <span className="text-xs uppercase font-mono-metrics tracking-[0.2em] text-[#190E85] font-bold mb-4 block">
                Module Architecture
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.08] mb-6">
                Experience the <br />
                <span className="font-serif-italic font-normal text-gradient-neon">
                  Platform Rail
                </span>
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-8 font-normal">
                Scroll to traverse SmartStore AI's modular engine along our high-velocity electric rail.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono-metrics text-slate-400 uppercase tracking-widest font-semibold">
                <span>Scroll to advance</span>
                <span className="w-8 h-[2px] bg-[#190E85] inline-block" />
              </div>
            </div>

            {/* Module Cards */}
            {GALLERY_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="w-[85vw] sm:w-[460px] h-[500px] shrink-0 white-glass-panel p-10 flex flex-col justify-between group relative overflow-hidden shadow-lg border border-white gallery-card"
                >
                  <div
                    className="absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-20 blur-2xl pointer-events-none transition-opacity group-hover:opacity-40"
                    style={{ backgroundColor: module.accent }}
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs font-mono-metrics font-bold tracking-widest text-[#190E85]">
                      {module.tag}
                    </span>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: module.accent }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="relative z-10 my-auto py-6">
                    <div className="w-full h-32 rounded-2xl bg-slate-50 border border-slate-200/80 p-5 flex flex-col justify-center gap-3 group-hover:border-[#00E0FF]/40 transition-colors shadow-inner">
                      <div className="w-3/4 h-3 rounded-full bg-[#190E85]/20 animate-pulse" />
                      <div className="w-1/2 h-3 rounded-full bg-[#00E0FF]/30" />
                      <div className="w-5/6 h-3 rounded-full bg-slate-200" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <span className="text-xs text-slate-400 font-mono-metrics mb-1 block font-semibold">
                      {module.subtitle}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {module.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
