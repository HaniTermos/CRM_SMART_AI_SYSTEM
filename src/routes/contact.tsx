import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  ArrowRight,
  MessageSquare,
  Headphones,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { SpecularButton } from "@/components/homepage/SpecularButton";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const contactMethods = [
  {
    icon: Mail,
    label: "Email us",
    value: "hello@smartstore.ai",
    href: "mailto:hello@smartstore.ai",
    desc: "We reply within 2 business hours.",
  },
  {
    icon: Phone,
    label: "Call us",
    value: "+1 (555) 014-3278",
    href: "tel:+15550143278",
    desc: "Mon–Fri, 9am–6pm EST.",
  },
  {
    icon: MapPin,
    label: "Visit us",
    value: "Brooklyn, NY",
    href: "#",
    desc: "HQ + remote team across 8 countries.",
  },
];

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Wire this to your API / email service (Resend, SendGrid, etc.)
    console.log(form);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
      {/* ═════════════ HEADER ═════════════ */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#00E0FF]" />
            <span className="text-xs font-mono font-medium text-slate-600 uppercase tracking-wider">
              Contact
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6"
          >
            Let's start a{" "}
            <span className="font-serif-italic font-normal text-gradient-neon">
              conversation
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 leading-relaxed"
          >
            Whether you want a demo, have a support question, or just want to
            say hello — we read every message and respond fast.
          </motion.p>
        </div>
      </section>

      {/* ═════════════ CONTACT METHODS ═════════════ */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, i) => (
              <motion.a
                key={method.label}
                href={method.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="white-glass-panel p-8 rounded-3xl text-center hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#190E85]/10 flex items-center justify-center text-[#190E85] mx-auto mb-4 group-hover:bg-[#190E85] group-hover:text-white transition-colors duration-300">
                  <method.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {method.label}
                </h3>
                <p className="text-[#190E85] font-medium mb-2">
                  {method.value}
                </p>
                <p className="text-sm text-slate-600">{method.desc}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════ FORM + INFO ═════════════ */}
      <section className="py-16 md:py-24 border-y border-slate-200/60 bg-white/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="md:col-span-3"
            >
              <div className="white-glass-panel p-8 md:p-10 rounded-3xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Send us a message
                </h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#03CF94]/15 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-[#03CF94]" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Message sent
                    </h3>
                    <p className="text-slate-600">
                      Thanks for reaching out. We'll be in touch shortly.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#190E85]/20 focus:border-[#190E85] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="john@restaurant.com"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#190E85]/20 focus:border-[#190E85] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Phone{" "}
                          <span className="text-slate-400 font-normal">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#190E85]/20 focus:border-[#190E85] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Topic
                        </label>
                        <select
                          name="subject"
                          required
                          value={form.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#190E85]/20 focus:border-[#190E85] transition-all appearance-none"
                        >
                          <option value="" disabled>
                            Select a topic
                          </option>
                          <option value="demo">Book a demo</option>
                          <option value="sales">Sales inquiry</option>
                          <option value="support">Technical support</option>
                          <option value="partners">Partnerships</option>
                          <option value="other">Something else</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Message
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your store, your goals, or your question..."
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#190E85]/20 focus:border-[#190E85] transition-all resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <p className="text-xs text-slate-500">
                        We respect your privacy. No spam, ever.
                      </p>
                      <SpecularButton variant="primary" className="!py-3 !px-8">
                        <span>Send message</span>
                        <Send className="w-4 h-4" />
                      </SpecularButton>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Sidebar Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="md:col-span-2 space-y-6"
            >
              <div className="white-glass-panel p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  What happens next?
                </h3>
                <div className="space-y-6">
                  {[
                    {
                      icon: MessageSquare,
                      title: "We read it",
                      desc: "A real human reviews your message within 2 hours during business hours.",
                    },
                    {
                      icon: Headphones,
                      title: "We respond",
                      desc: "Clear next steps, a calendar link, or an answer — no automated fluff.",
                    },
                    {
                      icon: ArrowRight,
                      title: "You decide",
                      desc: "No pressure. Book a demo, start a trial, or just keep our number handy.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#190E85]/10 flex items-center justify-center text-[#190E85] shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-0.5">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="white-glass-panel p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-[#190E85]" />
                  <h3 className="font-semibold text-slate-900">
                    Response times
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sales & demos</span>
                    <span className="font-semibold text-slate-900">
                      ~2 hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Technical support</span>
                    <span className="font-semibold text-slate-900">
                      ~4 hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">General inquiries</span>
                    <span className="font-semibold text-slate-900">
                      Same day
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═════════════ LOCATIONS STRIP ═════════════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Where we operate
            </h2>
            <p className="text-slate-600">
              Remote-first team with regional presence for on-site onboarding.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { city: "New York", role: "Global HQ", timezone: "EST" },
              { city: "London", role: "EMEA Operations", timezone: "GMT" },
              { city: "Singapore", role: "APAC Hub", timezone: "SGT" },
            ].map((loc, i) => (
              <motion.div
                key={loc.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="white-glass-panel p-6 rounded-3xl text-center"
              >
                <h3 className="font-bold text-slate-900 mb-1">{loc.city}</h3>
                <p className="text-sm text-[#190E85] font-medium mb-1">
                  {loc.role}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {loc.timezone}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
