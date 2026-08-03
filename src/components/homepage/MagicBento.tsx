import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Kanban, Store, Zap, BarChart3, ShieldCheck, ArrowUpRight,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { FloatingLines } from './FloatingLines';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

interface BentoItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: any;
  colSpan: string;
  accent: string;
  metric?: string;
  badge?: string;
}

const BENTO_ITEMS: BentoItem[] = [
  {
    id: 'ai-scoring',
    title: 'AI Demand Scoring Engine',
    category: 'Predictive Intelligence',
    description: 'Evaluate product viral potential and velocity heuristics with Gemini before stocking single units.',
    icon: Brain,
    colSpan: 'col-span-1 md:col-span-2',
    accent: 'from-[#190E85]/10 via-[#00E0FF]/10 to-transparent',
    metric: '98.4% Accuracy',
    badge: 'Gemini Powered',
  },
  {
    id: 'kanban-crm',
    title: 'Kanban Sales Pipeline',
    category: 'CRM Automation',
    description: 'Drag-and-drop customer journeys from lead generation to closed deal with automated sequences.',
    icon: Kanban,
    colSpan: 'col-span-1',
    accent: 'from-[#00E0FF]/15 to-transparent',
    metric: '4.2x Conversion',
  },
  {
    id: 'multi-tenant',
    title: 'Multi-Tenant Storefronts',
    category: 'Architecture',
    description: 'Deploy localized, branded storefronts instantly with independent inventory and cart states.',
    icon: Store,
    colSpan: 'col-span-1',
    accent: 'from-[#CF00FF]/10 to-transparent',
    metric: '< 50ms Latency',
  },
  {
    id: 'smart-campaigns',
    title: 'Autonomous Email Workflows',
    category: 'Marketing',
    description: 'AI crafts hyper-personalized email workflows based on purchasing habits and customer scores.',
    icon: Zap,
    colSpan: 'col-span-1 md:col-span-2',
    accent: 'from-[#190E85]/10 to-transparent',
    metric: '68% Open Rate',
    badge: 'Auto-Triggered',
  },
  {
    id: 'analytics',
    title: 'Real-Time Revenue Command',
    category: 'Analytics',
    description: 'Deep metrics stream tracking gross merchandise value, cart abandonment, and customer lifetime values.',
    icon: BarChart3,
    colSpan: 'col-span-1 md:col-span-2',
    accent: 'from-[#00E0FF]/15 to-transparent',
    metric: 'Live Metrics',
  },
  {
    id: 'security',
    title: 'Enterprise Trust & SSO',
    category: 'Security',
    description: 'Role-based access control, automated audit logging, and SOC2 compliant data encryption by default.',
    icon: ShieldCheck,
    colSpan: 'col-span-1',
    accent: 'from-[#03CF94]/15 to-transparent',
    metric: '99.99% Uptime',
  },
];

function BentoCard({ item }: { item: BentoItem }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50, rotX: 0, rotY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      rotY: ((x - rect.width / 2) / (rect.width / 2)) * 8,
      rotX: -((y - rect.height / 2) / (rect.height / 2)) * 8,
    });
  };

  const Icon = item.icon;

  return (
    <div className={`perspective-container bento-card-tile ${item.colSpan}`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setMousePos(p => ({ ...p, rotX: 0, rotY: 0 })); }}
        animate={{ rotateX: mousePos.rotX, rotateY: mousePos.rotY }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        whileTap={{ scale: 0.98 }}
        className="white-glass-card group relative h-full p-8 md:p-10 flex flex-col justify-between overflow-hidden cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Cursor spotlight radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(25, 14, 133, 0.06), transparent 60%)`,
          }}
        />
        <div className={`absolute -inset-20 bg-gradient-to-br ${item.accent} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="w-12 h-12 rounded-2xl white-glass-panel flex items-center justify-center text-[#190E85] group-hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-200">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="px-3 py-1 text-[10px] font-mono-metrics uppercase tracking-wider rounded-full bg-[#190E85]/10 text-[#190E85] font-semibold border border-[#190E85]/15">
                {item.badge}
              </span>
            )}
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-[#190E85] group-hover:bg-[#190E85]/10 transition-all"
              whileHover={{ scale: 1.15, rotate: 15 }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>

        <div className="relative z-10">
          <span className="text-xs uppercase font-mono-metrics tracking-widest text-[#190E85] font-semibold mb-2 block">
            {item.category}
          </span>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-3 group-hover:-translate-y-0.5 transition-all duration-300">
            {item.title}
          </h3>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-lg mb-6 font-normal">
            {item.description}
          </p>
          {item.metric && (
            <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-mono-metrics text-slate-400">Benchmark</span>
              <span className="text-xs font-bold text-[#190E85] font-mono-metrics">{item.metric}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function MagicBento() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const gridEl = gridRef.current;
    if (!sectionEl || !gridEl) return;

    const ctx = gsap.context(() => {
      const tiles = gridEl.querySelectorAll('.bento-card-tile');

      // ═══ ENTRANCE: FloatingLines ignites + Cards emerge from deep space ═══
      gsap.fromTo(linesRef.current, { opacity: 0 }, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionEl, start: 'top 85%', toggleActions: 'play none none reverse' },
      });

      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      // Center-out stagger: center card scale 0.88 → 1.02 → 1.0, outers scale 0.9 → 1.0
      gsap.fromTo(tiles,
        { opacity: 0, scale: 0.88, y: 60 },
        {
          opacity: 1, scale: 1, y: 0,
          stagger: { amount: 0.6, from: 'center' },
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: { trigger: gridEl, start: 'top 78%', toggleActions: 'play none none reverse' },
        }
      );

      // ═══ EXIT: Lateral slide OUT to the LEFT ═══
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'bottom 45%',
          end: 'bottom top',
          scrub: 0.8,
          onEnterBack: () => {
            gsap.to(gridEl, { x: 0, opacity: 1, scale: 1, duration: 0.3, overwrite: true });
            gsap.to(headerRef.current, { x: 0, opacity: 1, duration: 0.3, overwrite: true });
            gsap.to(linesRef.current, { opacity: 1, duration: 0.3, overwrite: true });
          },
        },
      });
      exitTl.to(headerRef.current, { x: '-40vw', opacity: 0, ease: 'power2.in' }, 0);
      exitTl.to(gridEl, { x: '-60vw', opacity: 0, scale: 0.95, ease: 'power2.in' }, 0.05);
      exitTl.to(linesRef.current, { opacity: 0.15, ease: 'power1.in' }, 0);
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-32 md:py-40 px-6 max-w-7xl mx-auto z-10 bg-transparent overflow-hidden">
      {/* React Bits Background Studio: FloatingLines Canvas Field */}
      <div ref={linesRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0 }}>
        <FloatingLines
          linesGradient={['#06B6D4', '#2F4BC0', '#A855F7']}
          animationSpeed={1}
          interactive={true}
          bendRadius={6}
          bendStrength={-0.8}
          mouseDamping={0.05}
          parallax={true}
          parallaxStrength={0.2}
          opacity={1}
        />
      </div>

      {/* Section Header */}
      <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20 relative z-10">
        <span className="text-xs uppercase font-mono-metrics tracking-[0.2em] text-[#190E85] font-bold mb-4 block">
          Capabilities
        </span>
        <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08] mb-6">
          Everything to run <br />
          <span className="font-serif-italic font-normal text-gradient-neon">
            a modern store
          </span>
        </h2>
        <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto font-normal">
          Every tool you need to run a high-volume storefront and sales pipeline in one cohesive engine.
        </p>
      </div>

      {/* Magic Bento Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-10 origin-left">
        {BENTO_ITEMS.map(item => <BentoCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
