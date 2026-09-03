import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Brain,
  Store,
  Workflow,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SpecularButton } from "@/components/homepage/SpecularButton";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

/* ───────────────────────────────────────────────
   1. HERO SECTION
   ─────────────────────────────────────────────── */
function ServicesHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[#F9FAFB]">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#190E85]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00E0FF]/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-[#00E0FF]" />
          <span className="text-xs font-mono font-medium text-slate-600 uppercase tracking-wider">
            Our Solutions
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6"
        >
          Everything to run your
          <br />
          store on{" "}
          <span className="font-serif-italic font-normal text-gradient-neon">
            autopilot
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-normal leading-relaxed"
        >
          From demand forecasting to multi-storefront orchestration. One
          platform, infinite scale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <SpecularButton variant="primary" href="/contact">
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </SpecularButton>
          <Link
            to="/"
            className="text-sm font-semibold text-slate-600 hover:text-[#190E85] transition-colors flex items-center gap-2"
          >
            View Pricing <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-slate-300 flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#190E85]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   2. BENTO SERVICES GRID
   ─────────────────────────────────────────────── */
const SERVICES = [
  {
    id: "demand-ai",
    title: "Demand Forecasting",
    description:
      "Gemini-powered predictive analytics that anticipate inventory needs 30-90 days ahead with 94% accuracy.",
    icon: Brain,
    color: "from-[#190E85] to-[#00E0FF]",
    span: "col-span-12 md:col-span-6 lg:col-span-7",
    features: [
      "Seasonal trend detection",
      "Auto-reorder triggers",
      "Supplier lead-time optimization",
    ],
  },
  {
    id: "multi-store",
    title: "Multi-Storefront",
    description:
      "Manage Shopify, WooCommerce, and custom storefronts from a unified command center.",
    icon: Store,
    color: "from-[#00E0FF] to-[#190E85]",
    span: "col-span-12 md:col-span-6 lg:col-span-5",
    features: ["Real-time sync", "Centralized inventory", "Cross-channel analytics"],
  },
  {
    id: "crm-pipeline",
    title: "CRM Pipeline",
    description:
      "AI-driven customer segmentation and automated nurture campaigns that convert.",
    icon: Workflow,
    color: "from-[#190E85] to-[#7C3AED]",
    span: "col-span-12 md:col-span-6 lg:col-span-5",
    features: ["Behavioral scoring", "Auto-segmentation", "Journey automation"],
  },
  {
    id: "analytics",
    title: "Unified Analytics",
    description:
      "Executive dashboards with actionable insights across all commerce touchpoints.",
    icon: BarChart3,
    color: "from-[#7C3AED] to-[#00E0FF]",
    span: "col-span-12 md:col-span-6 lg:col-span-7",
    features: ["Custom reports", "Real-time KPIs", "Export & share"],
  },
  {
    id: "security",
    title: "Enterprise Security",
    description:
      "SOC-2 compliant infrastructure with end-to-end encryption and role-based access.",
    icon: Shield,
    color: "from-[#190E85] to-[#1E293B]",
    span: "col-span-12 md:col-span-6 lg:col-span-4",
    features: ["SSO & SAML", "Audit logs", "GDPR ready"],
  },
  {
    id: "automation",
    title: "Workflow Automation",
    description:
      "No-code rule engine to automate repetitive commerce operations at scale.",
    icon: Zap,
    color: "from-[#00E0FF] to-[#10B981]",
    span: "col-span-12 md:col-span-6 lg:col-span-8",
    features: ["Visual builder", "500+ integrations", "Conditional logic"],
  },
];

function ServicesBento() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Built for modern{" "}
            <span className="font-serif-italic font-normal text-gradient-neon">
              merchants
            </span>
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Modular services that work standalone or together. Scale what you
            need, when you need it.
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`${service.span} group relative`}
            >
              <div className="white-glass-panel h-full p-8 md:p-10 border border-white shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Hover gradient orb */}
                <div
                  className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-700 rounded-full`}
                />

                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <service.icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  <ul className="space-y-2.5">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2.5 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#00E0FF] shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-6 border-t border-slate-200/60">
                    <button className="text-sm font-semibold text-[#190E85] flex items-center gap-2 group/btn">
                      Learn more
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   3. METRICS BANNER
   ─────────────────────────────────────────────── */
const METRICS = [
  { value: "94%", label: "Forecast Accuracy" },
  { value: "3.2x", label: "ROI Average" },
  { value: "50+", label: "Integrations" },
  { value: "12ms", label: "API Latency" },
];

function MetricsBanner() {
  return (
    <section className="py-20 bg-[#190E85] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34h4v4h-4zM20 20h4v4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {METRICS.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {metric.value}
              </div>
              <div className="text-sm font-mono text-[#00E0FF] uppercase tracking-widest">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   4. PROCESS TIMELINE
   ─────────────────────────────────────────────── */
const PROCESS_STEPS = [
  {
    number: "01",
    title: "Connect",
    description:
      "One-click integrations with Shopify, WooCommerce, Amazon, and 50+ channels.",
  },
  {
    number: "02",
    title: "Train",
    description:
      "Gemini AI analyzes your historical data, seasonality, and market trends.",
  },
  {
    number: "03",
    title: "Automate",
    description:
      "Set intelligent rules for inventory, pricing, and customer engagement.",
  },
  {
    number: "04",
    title: "Scale",
    description:
      "Watch your operations run autonomously while you focus on growth.",
  },
];

function ProcessTimeline() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #190E85 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-xs font-mono font-bold text-[#190E85] uppercase tracking-widest mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
            From setup to scale in{" "}
            <span className="font-serif-italic font-normal text-gradient-neon">
              minutes
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 md:gap-6">
          {PROCESS_STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line (desktop only) */}
              {index < PROCESS_STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-slate-200 to-transparent" />
              )}

              <div className="white-glass-panel p-8 border border-slate-100 shadow-md hover:shadow-xl transition-shadow duration-500 h-full">
                <span className="text-5xl font-bold text-slate-200 font-mono block mb-6">
                  {step.number}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   5. INTEGRATION MARQUEE
   ─────────────────────────────────────────────── */
const INTEGRATIONS = [
  "Shopify",
  "WooCommerce",
  "Amazon",
  "Stripe",
  "Salesforce",
  "HubSpot",
  "QuickBooks",
  "Slack",
  "Zapier",
  "Google Analytics",
];

function IntegrationMarquee() {
  const doubled = [...INTEGRATIONS, ...INTEGRATIONS];

  return (
    <section className="py-16 bg-[#F9FAFB] border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <p className="text-center text-sm font-mono text-slate-500 uppercase tracking-widest">
          Integrates with your existing stack
        </p>
      </div>

      <div className="relative flex overflow-x-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-6 px-6 shrink-0"
        >
          {doubled.map((item, i) => (
            <div
              key={`${item}-${i}`}
              className="white-glass-panel px-8 py-4 border border-slate-200 shadow-sm whitespace-nowrap text-slate-700 font-semibold text-sm"
            >
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   6. PAGE ASSEMBLY
   ─────────────────────────────────────────────── */
function ServicesPage() {
  return (
    <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
      <ServicesHero />
      <ServicesBento />
      <MetricsBanner />
      <ProcessTimeline />
      <IntegrationMarquee />
    </main>
  );
}