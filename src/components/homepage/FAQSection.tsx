import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, HelpCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1', category: 'AI Engine',
    question: 'What AI models power SmartStore AI demand scoring?',
    answer: 'SmartStore AI integrates Google Gemini models trained on historical retail velocity, search trends, and price elasticity heuristics to predict product sales before stocking inventory.',
  },
  {
    id: 'faq-2', category: 'Architecture',
    question: 'How does multi-tenant storefront routing work?',
    answer: 'Our edge architecture handles custom subdomains, multi-currency cart isolation, and real-time inventory synchronization across hundreds of store instances from one unified backend.',
  },
  {
    id: 'faq-3', category: 'Migration',
    question: 'Can I import my existing store products and CRM leads?',
    answer: 'Yes! We provide one-click CSV and REST API importers for Shopify, WooCommerce, and standard CSV customer lists to import your full pipeline seamlessly.',
  },
  {
    id: 'faq-4', category: 'Security',
    question: 'How is customer data and security handled?',
    answer: 'All customer data is encrypted in transit and at rest with SOC2 compliant infrastructure, automated audit logs, and strict role-based access permissions.',
  },
  {
    id: 'faq-5', category: 'Onboarding',
    question: 'What is the setup timeline for launch?',
    answer: 'Most merchants deploy their first active store and CRM pipeline in under 15 minutes. Enterprise clients receive dedicated onboarding managers for custom AI tuning.',
  },
];

export function FAQSection() {
  const [activeId, setActiveId] = useState(FAQS[0].id);
  const activeFaq = FAQS.find(f => f.id === activeId) || FAQS[0];
  const sectionRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const blockEl = blockRef.current;
    const questionsEl = questionsRef.current;
    if (!sectionEl || !blockEl || !questionsEl) return;

    const ctx = gsap.context(() => {
      // 1. VERTICAL ELEVATOR ENTRANCE: Block slides UP into view from below (y: 60vh -> 0vh)
      gsap.fromTo(blockEl, 
        { opacity: 0, y: '50vh' },
        {
          opacity: 1, y: '0vh',
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionEl, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      // Stagger reveal for individual questions
      const questions = questionsEl.querySelectorAll('.faq-question-btn');
      gsap.fromTo(questions, 
        { opacity: 0, x: -30 }, 
        {
          opacity: 1, x: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: questionsEl, start: 'top 70%', toggleActions: 'play none none reverse' },
        }
      );
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="relative py-32 md:py-48 bg-[#F9FAFB] z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs uppercase font-mono-metrics tracking-[0.2em] text-[#190E85] font-bold mb-4 block">
            Clarifications
          </span>
          <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08] mb-6">
            Frequently Asked <br />
            <span className="font-serif-italic font-normal text-gradient-neon">
              Questions
            </span>
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto font-normal">
            Everything you need to know about SmartStore AI architecture, security, and pricing.
          </p>
        </motion.div>

        {/* 2-Column White-Glass FAQ Block */}
        <div ref={blockRef} className="white-glass-panel p-8 md:p-12 shadow-xl border border-white" style={{ opacity: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Question List */}
            <div ref={questionsRef} className="lg:col-span-6 space-y-3">
              {FAQS.map((faq, index) => {
                const isActive = faq.id === activeId;
                return (
                  <button
                    key={faq.id}
                    onClick={() => setActiveId(faq.id)}
                    className={`faq-question-btn w-full text-left p-5 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                      isActive
                        ? 'bg-white shadow-md border border-slate-200/80 text-[#190E85]'
                        : 'hover:bg-white/60 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono-metrics font-bold transition-colors ${
                        isActive
                          ? 'bg-[#190E85] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-[#190E85]/10 group-hover:text-[#190E85]'
                      }`}>
                        0{index + 1}
                      </div>
                      <span className="text-base font-semibold tracking-tight">{faq.question}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                      isActive ? 'rotate-90 text-[#190E85]' : 'text-slate-300 group-hover:text-slate-500'
                    }`} />
                  </button>
                );
              })}
            </div>

            {/* Right: Answer Panel */}
            <div className="lg:col-span-6 lg:pl-6 pt-4 lg:pt-0">
              <div className="white-glass-card p-8 min-h-[300px] flex flex-col justify-between border border-slate-200/70 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-[#190E85] pointer-events-none">
                  <HelpCircle className="w-24 h-24" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFaq.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10"
                  >
                    <span className="text-xs uppercase font-mono-metrics font-bold tracking-widest text-[#190E85] mb-3 block">
                      {activeFaq.category}
                    </span>
                    <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mb-4">
                      {activeFaq.question}
                    </h3>
                    <p className="text-base text-slate-600 leading-relaxed font-normal">
                      {activeFaq.answer}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="pt-6 mt-8 border-t border-slate-200/80 flex items-center justify-between relative z-10">
                  <span className="text-xs text-slate-400 font-mono-metrics">Need more details?</span>
                  <a href="#contact" className="text-xs font-bold text-[#190E85] hover:underline font-mono-metrics">
                    Talk to our engineering team →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
