import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SoftAurora } from './SoftAurora';
import { SpecularButton } from './SpecularButton';

gsap.registerPlugin(ScrollTrigger);

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  backQuote: string;
  backAuthor: string;
}

const PLANS: Plan[] = [
  {
    name: 'Starter', price: '$0', period: '/month',
    description: 'Perfect for trying out SmartStore AI with a single storefront.',
    features: ['1 storefront', 'Up to 100 products', 'Basic AI insights', 'Community support', 'Standard analytics'],
    highlighted: false, cta: 'Start free',
    backQuote: '"We launched our first store in under 10 minutes. The onboarding experience is seamless."',
    backAuthor: 'Alex M. — Indie Founder',
  },
  {
    name: 'Professional', price: '$49', period: '/mo',
    description: 'For growing businesses ready to scale with AI automation.',
    features: ['5 storefronts', 'Unlimited products', 'Advanced AI scoring', 'Kanban CRM pipeline', 'Email campaigns', 'Priority support'],
    highlighted: true, cta: 'Start building',
    backQuote: '"SmartStore AI replaced 4 separate tools for us. The CRM pipeline alone paid for itself in the first week."',
    backAuthor: 'Sarah K. — CEO, TechFlow',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    description: 'Dedicated infrastructure and custom AI model training.',
    features: ['Unlimited storefronts', 'Custom AI models', 'Dedicated account manager', 'SLA guarantee', 'White-label options', 'SSO & audit logs'],
    highlighted: false, cta: 'Contact sales',
    backQuote: '"The enterprise tier gave us full control. Custom AI models trained on our catalog changed everything."',
    backAuthor: 'David R. — CTO, GlobalRetail',
  },
];

function FlipCard({ plan, index }: { plan: Plan; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className={`perspective-container ${plan.highlighted ? 'md:-mt-6 md:mb-6' : ''}`}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={plan.highlighted ? { rotateY: 20 } : { rotateY: 0 }}
        animate={{ rotateY: 0 }}
        transition={{ delay: 0.6 + index * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.02 }}
        className="relative w-full h-[570px] cursor-pointer"
        style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 white-glass-panel p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xl border border-white"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {plan.highlighted && (
              <div className="absolute inset-0 rounded-[24px] pointer-events-none" style={{
                padding: '1px',
                background: 'linear-gradient(135deg, #190E85, #00E0FF, #CF00FF, #190E85)',
                backgroundSize: '300% 300%',
                animation: 'neonShift 6s ease infinite',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }} />
            )}

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-semibold">{plan.name}</span>
                {plan.highlighted && (
                  <span className="px-3 py-1 text-[10px] uppercase font-mono-metrics tracking-wider rounded-full bg-[#190E85]/10 text-[#190E85] font-bold border border-[#190E85]/20">
                    Most Popular
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-extrabold text-[#190E85] tabular-nums tracking-tight">{plan.price}</span>
                <span className="text-slate-400 text-sm font-medium">{plan.period}</span>
              </div>
              <p className="text-sm text-slate-600 mb-8 font-normal">{plan.description}</p>
              <ul className="space-y-3 mb-auto">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-[#00E0FF] mt-0.5 shrink-0 stroke-[3]" />
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <SpecularButton variant={plan.highlighted ? 'primary' : 'outline'} className="w-full">
                  {plan.cta}
                </SpecularButton>
              </div>
              <p className="text-center text-[10px] text-slate-400 font-mono-metrics mt-3 tracking-wider uppercase font-semibold">
                Click to flip 3D →
              </p>
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 rounded-[24px] p-8 md:p-10 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #190E85 0%, #0F0954 100%)',
            }}
          >
            <div className="relative z-10 max-w-xs">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full border border-white/20 flex items-center justify-center text-2xl font-serif-italic">"</div>
              <p className="text-lg text-white/90 font-medium leading-relaxed mb-8 font-serif-italic">{plan.backQuote}</p>
              <p className="text-xs text-[#00E0FF] font-mono-metrics tracking-widest uppercase font-semibold">{plan.backAuthor}</p>
            </div>
            <p className="absolute bottom-6 text-[10px] text-white/40 font-mono-metrics tracking-wider uppercase font-semibold">
              Click to flip back
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PricingFlipCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const auroraEl = auroraRef.current;
    const cardsEl = cardsRef.current;
    if (!sectionEl || !auroraEl || !cardsEl) return;

    const ctx = gsap.context(() => {
      // ═══ ENTRANCE: SoftAurora blooms in, Cards slide IN from bottom-left diagonal ═══
      gsap.fromTo(auroraEl, { opacity: 0, scale: 0.9 }, {
        opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out',
        scrollTrigger: { trigger: sectionEl, start: 'top 80%', toggleActions: 'play none none reverse' },
      });

      gsap.fromTo(cardsEl, 
        { opacity: 0, x: '-30vw', y: '15vh' },
        {
          opacity: 1, x: '0vw', y: '0vh',
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionEl, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );

      // ═══ EXIT: Cards slide UP (-70vh) & Aurora dims to ~0.3 ═══
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'bottom 40%',
          end: 'bottom top',
          scrub: 0.8,
          onEnterBack: () => {
            gsap.to(cardsEl, { opacity: 1, y: 0, scale: 1, duration: 0.3, overwrite: true });
            gsap.to(auroraEl, { opacity: 1, duration: 0.3, overwrite: true });
          },
        },
      });
      exitTl.to(cardsEl, { opacity: 0, y: '-70vh', scale: 0.94, ease: 'power2.in' }, 0);
      exitTl.to(auroraEl, { opacity: 0.3, ease: 'power1.in' }, 0);
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="relative py-32 md:py-48 z-10 overflow-hidden bg-transparent perspective-container">
      {/* React Bits Background Studio: SoftAurora Canvas Field */}
      <div ref={auroraRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0 }}>
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={1}
          color1="#A855F7"
          color2="#3B82F6"
          enableMouseInteraction={true}
          mouseInfluence={0.25}
          opacity={1}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-8 z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs uppercase font-mono-metrics tracking-[0.2em] text-[#190E85] font-bold mb-4 block">
            Pricing
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.08] mb-6">
            Transparent, <br />
            <span className="font-serif-italic font-normal text-gradient-neon">
              simple pricing
            </span>
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto font-normal">
            Start free. Scale when you're ready. No hidden fees, ever.
          </p>
        </motion.div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {PLANS.map((plan, i) => <FlipCard key={plan.name} plan={plan} index={i} />)}
        </div>
      </div>
    </section>
  );
}
