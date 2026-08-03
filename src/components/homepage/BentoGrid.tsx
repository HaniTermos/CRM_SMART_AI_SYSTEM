import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Kanban,
  Store,
  Zap,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

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
    category: 'Predictive Analytics',
    description:
      'Evaluate product viral potential and historical velocity heuristics with Gemini before stocking single unit.',
    icon: Brain,
    colSpan: 'col-span-1 md:col-span-2',
    accent: 'from-[#C9A96E]/20 to-purple-500/10',
    metric: '98.4% Accuracy',
    badge: 'Gemini 3.5 Turbo',
  },
  {
    id: 'kanban-crm',
    title: 'Kanban Sales Pipeline',
    category: 'CRM Automation',
    description:
      'Drag-and-drop customer journeys from lead generation to closed deal with automated follow-up sequences.',
    icon: Kanban,
    colSpan: 'col-span-1',
    accent: 'from-blue-500/20 to-indigo-500/10',
    metric: '4.2x Conversion',
  },
  {
    id: 'multi-tenant',
    title: 'Multi-Tenant Storefronts',
    category: 'Architecture',
    description:
      'Deploy localized, branded storefronts instantly with independent inventory, custom routing, and cart state.',
    icon: Store,
    colSpan: 'col-span-1',
    accent: 'from-emerald-500/20 to-teal-500/10',
    metric: '< 50ms Latency',
  },
  {
    id: 'smart-campaigns',
    title: 'Autonomous Email Campaigns',
    category: 'Marketing',
    description:
      'AI crafts hyper-personalized email workflows based on purchasing habits and customer engagement scores.',
    icon: Zap,
    colSpan: 'col-span-1 md:col-span-2',
    accent: 'from-amber-500/20 to-orange-500/10',
    metric: '68% Open Rate',
    badge: 'Auto-Triggered',
  },
  {
    id: 'analytics',
    title: 'Real-Time Revenue Command',
    category: 'Insights',
    description:
      'Deep metrics stream tracking gross merchandise value, cart abandonment, and customer lifetime values.',
    icon: BarChart3,
    colSpan: 'col-span-1 md:col-span-2',
    accent: 'from-cyan-500/20 to-blue-600/10',
    metric: 'Live Metrics',
  },
  {
    id: 'security',
    title: 'Enterprise Trust & SSO',
    category: 'Security',
    description:
      'Role-based access control, automated audit logging, and SOC2 compliant data encryption by default.',
    icon: ShieldCheck,
    colSpan: 'col-span-1',
    accent: 'from-rose-500/20 to-pink-500/10',
    metric: '99.99% Uptime',
  },
];

/* Single Bento Card with 3D Tilt + Spotlight */
function BentoCard({ item, index }: { item: BentoItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50, rotX: 0, rotY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const posX = (x / rect.width) * 100;
    const posY = (y / rect.height) * 100;

    // Calculate subtle 3D tilt angles (max 10 deg)
    const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
    const rotX = -((y - rect.height / 2) / (rect.height / 2)) * 8;

    setMousePos({ x: posX, y: posY, rotX, rotY });
  };

  const Icon = item.icon;

  return (
    <motion.div
      ref={cardRef}
      className={`perspective-container ${item.colSpan}`}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos((p) => ({ ...p, rotX: 0, rotY: 0 }));
        }}
        animate={{
          rotateX: mousePos.rotX,
          rotateY: mousePos.rotY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="glass-card-deep group relative h-full p-8 md:p-10 flex flex-col justify-between overflow-hidden cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Mouse Spotlight Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.08), transparent 60%)`,
          }}
        />

        {/* Ambient Gradient Glow */}
        <div
          className={`absolute -inset-20 bg-gradient-to-br ${item.accent} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="w-12 h-12 rounded-2xl glass-navbar flex items-center justify-center border border-white/10 text-[#C9A96E] group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2">
            {item.badge && (
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full bg-white/10 text-white/80 border border-white/10">
                {item.badge}
              </span>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-white/10 transition-all">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="relative z-10">
          <span className="text-xs uppercase font-mono tracking-widest text-[#C9A96E] mb-2 block">
            {item.category}
          </span>
          <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-3 group-hover:translate-x-1 transition-transform duration-300">
            {item.title}
          </h3>
          <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-lg mb-6">
            {item.description}
          </p>

          {item.metric && (
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-white/40">Performance Benchmark</span>
              <span className="text-xs font-semibold text-[#E5C384] font-mono">{item.metric}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function BentoGrid() {
  return (
    <section id="features" className="relative py-32 md:py-48 px-6 max-w-7xl mx-auto z-10">
      {/* Section Header */}
      <motion.div
        className="text-center max-w-3xl mx-auto mb-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-xs uppercase font-mono tracking-[0.2em] text-[#C9A96E] mb-4 block">
          Platform Architecture
        </span>
        <h2 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-[1.08] mb-6">
          Engineered for <br />
          <span className="font-serif-italic font-normal gold-gradient-text">
            Autonomous Scale
          </span>
        </h2>
        <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto">
          Every tool you need to run a high-volume storefront and sales pipeline in a single cohesive system.
        </p>
      </motion.div>

      {/* Grid Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {BENTO_ITEMS.map((item, index) => (
          <BentoCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
