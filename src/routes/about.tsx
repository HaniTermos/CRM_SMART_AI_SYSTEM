import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Zap,
  Target,
  Heart,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Utensils,
  Store,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { SpecularButton } from "@/components/homepage/SpecularButton";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const values = [
  {
    icon: Zap,
    title: "Speed First",
    desc: "Performance is a feature. Every millisecond counts when a customer is hungry.",
  },
  {
    icon: Target,
    title: "Precision",
    desc: "AI-driven insights that actually matter. No vanity metrics, just revenue.",
  },
  {
    icon: Heart,
    title: "Human-Centered",
    desc: "Built for operators who have never written a line of code.",
  },
];

function AboutPage() {
  return (
    <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
      {/* ═════════════ MISSION ═════════════ */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#00E0FF]" />
            <span className="text-xs font-mono font-medium text-slate-600 uppercase tracking-wider">
              Our Mission
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6"
          >
            Commerce should run{" "}
            <span className="font-serif-italic font-normal text-gradient-neon">
              itself
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 leading-relaxed"
          >
            SmartStore AI exists because small restaurant and retail owners
            deserve the same intelligent automation that billion-dollar chains
            use — without hiring a tech team.
          </motion.p>
        </div>
      </section>

      {/* ═════════════ THE PROBLEM ═════════════ */}
      <section className="py-16 md:py-24 border-y border-slate-200/60 bg-white/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              The problem with today's tools
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Restaurant owners juggle five different apps to run one store: one
              for orders, one for inventory, one for CRM, one for analytics, and
              another for loyalty. None of them talk to each other. None of them
              predict anything. And every one of them charges a monthly fee that
              eats into already thin margins.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: "Fragmented Stack",
                desc: "Average merchant uses 4+ disconnected tools. Data lives in silos.",
              },
              {
                icon: TrendingUp,
                title: "No Forecasting",
                desc: "You only know you're out of stock after a customer orders.",
              },
              {
                icon: Utensils,
                title: "Built for Engineers",
                desc: "Most platforms require a developer to set up. You just want to cook.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="white-glass-navbar p-8 rounded-2xl text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#190E85]/10 flex items-center justify-center text-[#190E85] mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════ BUILT FOR / WHO IT SERVES ═════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Built for the owner who wears every hat
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                We started SmartStore AI in 2022 after watching a family-owned
                restaurant spend $800 a month on software that still couldn't
                tell them how much rice to order on Tuesday. They didn't need
                another dashboard. They needed a system that thinks.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Our platform combines demand forecasting, inventory management,
                CRM, and multi-storefront control into one autonomous engine
                powered by Gemini AI. It learns your patterns, predicts your
                needs, and runs your backend so you can focus on your customers.
              </p>

              <div className="flex flex-wrap gap-3">
                {[
                  "Restaurants",
                  "Cafés",
                  "Ghost Kitchens",
                  "Retail Chains",
                  "Pop-ups",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[#190E85]/10 text-[#190E85] text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="space-y-4">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="white-glass-navbar p-6 rounded-2xl flex items-start gap-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-3 rounded-xl bg-[#190E85]/10 text-[#190E85]">
                    <v.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {v.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════ TRUST / CREDIBILITY ═════════════ */}
      <section className="py-16 md:py-24 border-y border-slate-200/60 bg-white/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why operators trust us
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              We are operators who ship code. Every feature is battle-tested in
              real kitchens and stores before it reaches you.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { value: "12K+", label: "Active Stores" },
              { value: "$48M", label: "Revenue Generated" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9", label: "User Rating" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-[#190E85] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="white-glass-navbar p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#190E85]/10 text-[#190E85]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Enterprise-grade security
                </h3>
                <p className="text-sm text-slate-600 max-w-md">
                  SOC 2 Type II certified, end-to-end encryption, and
                  GDPR-compliant data handling. Your customer data never trains
                  third-party models.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#190E85]">
              <Globe className="w-4 h-4" />
              <span>
                Operating globally from New York, London, and Singapore
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═════════════ CONTACT / CTA ═════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Let's talk about your store
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Whether you run a single location or a multi-city chain, we will
                show you exactly how SmartStore AI can cut your software costs
                and predict your next best-selling item.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5 text-[#190E85]" />
                  <span>hello@smartstore.ai</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5 text-[#190E85]" />
                  <span>+1 (555) 014-3278</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-[#190E85]" />
                  <span>HQ: Brooklyn, NY — Remote team across 8 countries</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <SpecularButton href="/contact" variant="primary">
                  <span>Book a demo</span>
                  <ArrowRight className="w-4 h-4" />
                </SpecularButton>
                <SpecularButton href="/dashboard" variant="outline">
                  <span>Start building free</span>
                </SpecularButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="white-glass-navbar p-8 rounded-3xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                What happens next?
              </h3>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "15-minute discovery call",
                    desc: "We learn your menu, your pain points, and your goals.",
                  },
                  {
                    step: "2",
                    title: "Custom demo",
                    desc: "We plug in your real data so you see forecasts on your actual inventory.",
                  },
                  {
                    step: "3",
                    title: "Go live in 48 hours",
                    desc: "No developers needed. We handle migration from your current stack.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#190E85] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
