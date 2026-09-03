import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  HelpCircle,
  Search,
  MessageCircle,
  Sparkles,
  CreditCard,
  Code2,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { SpecularButton } from "@/components/homepage/SpecularButton";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
});

/* ─────────────── DATA ─────────────── */
type FAQItem = { q: string; a: string };

type FAQCategory = {
  id: string;
  icon: React.ElementType;
  label: string;
  items: FAQItem[];
};

const FAQ_DATA: FAQCategory[] = [
  {
    id: "getting-started",
    icon: HelpCircle,
    label: "Getting Started",
    items: [
      {
        q: "What is SmartStore AI and who is it for?",
        a: "SmartStore AI is a multi‑tenant e‑commerce engine powered by Gemini AI. It is built for D2C brands, multi‑store operators, and agencies that want autonomous demand scoring, CRM pipeline automation, and centralized storefront management in one platform.",
      },
      {
        q: "How do I book a demo or start a free trial?",
        a: "Click 'Get Started' in the navbar or visit our Contact page. You can book a 20‑minute live demo with our team, or start a self‑serve 14‑day trial instantly—no credit card required.",
      },
      {
        q: "How long does onboarding usually take?",
        a: "Most merchants are fully onboarded within 48 hours. Enterprise clients with custom integrations typically go live within 5–7 business days with dedicated white‑glove support.",
      },
    ],
  },
  {
    id: "platform",
    icon: Sparkles,
    label: "Platform & AI",
    items: [
      {
        q: "How does the Gemini AI demand scoring work?",
        a: "Our engine ingests real‑time store signals—traffic, inventory velocity, seasonality, and external trend data—and assigns a dynamic demand score to every SKU. High‑score items get automatic ad‑budget boosts, email nudges, and front‑page placement suggestions.",
      },
      {
        q: "Can I manage multiple storefronts from one dashboard?",
        a: "Yes. SmartStore AI is natively multi‑tenant. You can connect unlimited storefronts (Shopify, WooCommerce, custom headless) and toggle between them from a single unified dashboard with cross‑store analytics.",
      },
      {
        q: "What kind of automation does the CRM pipeline offer?",
        a: "The AI CRM auto‑segments visitors based on behavior, drafts personalized follow‑up sequences, predicts churn risk, and surfaces high‑intent leads to your sales team with recommended talking points.",
      },
    ],
  },
  {
    id: "pricing",
    icon: CreditCard,
    label: "Pricing & Billing",
    items: [
      {
        q: "Which pricing plan is right for me?",
        a: "Startups and single‑store merchants love our Growth plan. Multi‑store operators and agencies typically choose Scale for advanced automation and API access. Enterprise is tailor‑made for high‑volume merchants needing SLA guarantees and custom AI model tuning.",
      },
      {
        q: "Is there a limit on AI-generated recommendations?",
        a: "Growth includes 10,000 AI actions/month. Scale includes 100,000. Enterprise is unlimited. An 'AI action' is any scored recommendation, automated email, or pipeline trigger executed by the platform.",
      },
      {
        q: "Can I cancel or downgrade at any time?",
        a: "Absolutely. All plans are month‑to‑month unless you choose an annual contract for a 20% discount. You can downgrade, pause, or cancel directly from your billing settings—no cancellation fees.",
      },
    ],
  },
  {
    id: "technical",
    icon: Code2,
    label: "Technical & Integrations",
    items: [
      {
        q: "Do you offer a REST or GraphQL API?",
        a: "Both. Our REST API covers core resources, while GraphQL is available for custom storefronts and complex data fetching. You can generate API keys, view live docs, and test queries directly inside the dashboard.",
      },
      {
        q: "What storefront platforms do you support?",
        a: "Native integrations for Shopify, WooCommerce, BigCommerce, and Magento. For headless or custom builds, use our SDKs (React, Vue, Next.js) or raw API endpoints.",
      },
      {
        q: "Can I bring my own AI model or fine‑tune yours?",
        a: "Enterprise customers can supply proprietary datasets to fine‑tune demand‑scoring weights and CRM copy tone. We also support private model hosting via GCP or AWS for strict data‑sovereignty requirements.",
      },
    ],
  },
  {
    id: "security",
    icon: ShieldCheck,
    label: "Security & Privacy",
    items: [
      {
        q: "Is my customer data used to train public AI models?",
        a: "Never. Your data is isolated in a single‑tenant encryption layer. We do not use merchant data to train foundation models, and all AI inference runs inside your dedicated GCP project.",
      },
      {
        q: "Are you GDPR and CCPA compliant?",
        a: "Yes. We offer Data Processing Agreements (DPAs), automatic data‑deletion workflows, and cookie‑consent tooling out of the box. Our privacy team can provide SOC 2 Type II and ISO 27001 reports on request.",
      },
      {
        q: "What is your uptime SLA?",
        a: "Growth and Scale plans include a 99.9% uptime commitment. Enterprise includes 99.99% with a financially backed SLA and a dedicated technical account manager.",
      },
    ],
  },
];

/* ─────────────── COMPONENT ─────────────── */
function FAQPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.items.length > 0);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
      {/* ═════════════ HERO ═════════════ */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#00E0FF]" />
            <span className="text-xs font-mono font-medium text-slate-600 uppercase tracking-wider">
              FAQ
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6"
          >
            Questions?{" "}
            <span className="font-serif-italic font-normal text-gradient-neon">
              Answered.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10"
          >
            Everything you need to know about SmartStore AI. Can't find what
            you're looking for? Reach out and we'll respond within 2 hours.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative max-w-xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#190E85]/20 focus:border-[#190E85] transition-all shadow-sm"
            />
          </motion.div>
        </div>
      </section>

      {/* ═════════════ ACCORDION GRID ═════════════ */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No matches found
              </h3>
              <p className="text-slate-500">
                Try a different keyword or{" "}
                <a href="/contact" className="text-[#190E85] underline">
                  contact us
                </a>
                .
              </p>
            </motion.div>
          )}

          {filtered.map((category, catIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: catIndex * 0.08 }}
            >
              {/* Category Header — OUTSIDE the card */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#190E85]/10 flex items-center justify-center text-[#190E85]">
                  <category.icon className="w-[18px] h-[18px]" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {category.label}
                </h2>
              </div>

              {/* Card — heavily rounded, clean, flat items inside */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {category.items.map((item, itemIndex) => {
                  const itemId = `${category.id}::${item.q}`;
                  const isOpen = openId === itemId;

                  return (
                    <div
                      key={itemId}
                      className={`${
                        itemIndex !== category.items.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() => toggle(itemId)}
                        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <span className="font-medium text-slate-800 text-[15px] leading-snug">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              height: {
                                duration: 0.35,
                                ease: [0.16, 1, 0.3, 1],
                              },
                              opacity: { duration: 0.25 },
                            }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-5 text-[15px] text-slate-500 leading-relaxed max-w-2xl">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═════════════ BOTTOM CTA ═════════════ */}
      <section className="py-16 md:py-24 border-t border-slate-200/60 bg-white/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Our team is standing by. Get a personalized walkthrough or send us
              a message—we read every single one.
            </p>
            <SpecularButton href="/contact" variant="primary">
              <span>Contact Support</span>
              <ArrowRight className="w-4 h-4" />
            </SpecularButton>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
