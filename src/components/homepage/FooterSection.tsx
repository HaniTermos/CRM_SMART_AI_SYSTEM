import { motion } from 'framer-motion';
import { ArrowUp, ArrowRight, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { SpecularButton } from './SpecularButton';

const FOOTER_LINKS = {
  Product: ['Features', 'Pricing', 'Changelog', 'Documentation', 'API Reference'],
  Company: ['About', 'Blog', 'Careers', 'Press Kit'],
  Resources: ['Community', 'Tutorials', 'Templates', 'Integrations'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
};

const SOCIALS = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: '#', label: 'Email' },
];

export function FooterSection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative z-10 bg-[#F9FAFB] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-10">
        {/* Top CTA Banner */}
        <section id="cta" className="mb-24">
          <motion.div
            className="white-glass-panel p-10 md:p-16 text-center relative overflow-hidden shadow-2xl border border-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-radial from-[#00E0FF]/20 via-[#190E85]/10 to-transparent blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-3xl md:text-6xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                Ready to automate{' '}
                <span className="font-serif-italic font-normal text-gradient-neon">smarter?</span>
              </h3>
              <p className="text-slate-600 mb-10 max-w-lg mx-auto text-base md:text-lg font-normal">
                Join thousands of merchants already using SmartStore AI to grow their business on autopilot.
              </p>

              {/* Newsletter Input + Specular CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-6">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#190E85] shadow-sm transition-all"
                />
                <SpecularButton variant="primary" className="w-full sm:w-auto shrink-0">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </SpecularButton>
              </div>

              <div className="text-xs font-mono text-slate-400">
                14-day free trial • No credit card required
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4-Column Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-[#190E85] mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-600 hover:text-[#190E85] font-medium transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-[#190E85]">SmartStore</span>
            <span className="text-lg font-serif-italic text-gradient-neon">AI</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400 font-mono">
            © 2026 SmartStore AI. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#190E85] hover:border-[#190E85]/40 transition-all duration-300 shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lenis Scroll-To-Top Button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full white-glass-panel flex items-center justify-center border border-white text-[#190E85] hover:scale-110 transition-all duration-300 shadow-lg pointer-events-auto"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.4 }}
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </motion.button>
    </footer>
  );
}
