import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function CurvedLoop() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGAnimateElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const loopEl = loopRef.current;
    const cardEl = cardRef.current;
    if (!sectionEl || !loopEl || !cardEl) return;

    const ctx = gsap.context(() => {
      // ═══ PORTAL ENTRANCE: Loop text expands outward from dot seed (scale 0.35 -> 1.0) ═══
      gsap.fromTo(
        loopEl,
        { opacity: 0, scale: 0.35, rotate: -15 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            onUpdate: (self) => {
              // Dynamically boost rotation/velocity based on scroll speed
              const velocity = Math.abs(self.getVelocity());
              if (velocity > 100) {
                gsap.to(loopEl, { rotate: velocity * 0.015, duration: 0.2, ease: 'power1.out' });
              }
            },
          },
        }
      );

      // Foreground testimonial card rises in smoothly
      gsap.fromTo(
        cardEl,
        { opacity: 0, y: 40, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // ═══ EXIT: Loop scales down & fades, card shrinks slightly ═══
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'bottom 40%',
          end: 'bottom top',
          scrub: 0.8,
          onEnterBack: () => {
            gsap.to(loopEl, { opacity: 1, scale: 1, duration: 0.3, overwrite: true });
            gsap.to(cardEl, { opacity: 1, scale: 1, y: 0, duration: 0.3, overwrite: true });
          },
        },
      });
      exitTl.to(loopEl, { opacity: 0, scale: 0.85, ease: 'power1.in' }, 0);
      exitTl.to(cardEl, { opacity: 0, scale: 0.92, y: -30, ease: 'power2.in' }, 0);
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-32 md:py-48 bg-[#F9FAFB] z-10 overflow-hidden">
      {/* Portal Expansion SVG Curved Loop */}
      <div
        ref={loopRef}
        className="relative w-full flex items-center justify-center my-8 cursor-pointer origin-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ opacity: 0 }}
      >
        <svg viewBox="0 0 1200 240" className="w-full max-w-6xl h-48 select-none">
          <path
            id="curvedPath"
            d="M 50,120 Q 300,30 600,120 T 1150,120"
            fill="none"
            stroke="rgba(25, 14, 133, 0.08)"
            strokeWidth="2"
          />
          <text className={`text-[15px] uppercase tracking-[0.25em] fill-[#190E85] font-bold ${isHovered ? 'opacity-90' : 'opacity-40'} transition-opacity duration-500`}>
            <textPath href="#curvedPath" startOffset="0%">
              <animate
                ref={pathRef}
                attributeName="startOffset"
                from="0%"
                to="100%"
                dur={isHovered ? '24s' : '12s'}
                repeatCount="indefinite"
              />
              {'• TRUSTED BY MODERN MERCHANTS • AUTONOMOUS COMMERCE • SMARTSTORE AI '.repeat(3)}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Foreground Testimonial Card */}
      <div className="max-w-3xl mx-auto px-6 relative z-10 -mt-24">
        <div ref={cardRef} style={{ opacity: 0 }}>
          <motion.div
            className="white-glass-panel p-10 md:p-14 text-center shadow-xl border border-white relative overflow-hidden"
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#190E85]/10 text-[#190E85] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Quote className="w-6 h-6" />
            </div>
            <p className="text-xl md:text-3xl font-medium text-slate-900 leading-snug mb-8 tracking-tight font-serif-italic">
              "SmartStore AI replaced 4 separate tools for us. The AI demand scoring alone helped us avoid over $140,000 in unsold inventory within our first quarter."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#190E85] text-white font-bold flex items-center justify-center text-sm shadow-md">
                SJ
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#190E85]">Sarah Johnson</div>
                <div className="text-xs text-slate-500 font-mono-metrics">CEO, TechFlow Commerce</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
