import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, ArrowRight } from 'lucide-react';
import { SpecularButton } from './homepage/SpecularButton';
import { StaggeredMenu } from './homepage/StaggeredMenu';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 40);
    // Hide on scroll down after 100px, show on scroll up
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 md:px-8 md:pt-6 pointer-events-none"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          className={`max-w-6xl mx-auto transition-all duration-500 pointer-events-auto ${
            scrolled ? 'white-glass-navbar py-2.5 px-6 shadow-md' : 'white-glass-navbar py-3 px-6'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="group flex items-center gap-1">
              <span className="text-lg font-bold text-[#190E85] tracking-tight">
                SmartStore
              </span>
              <span className="text-lg font-serif-italic text-gradient-neon">AI</span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative text-sm text-slate-600 hover:text-[#190E85] font-semibold transition-colors duration-300 group py-1"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#190E85] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:block">
              <SpecularButton href="/dashboard" variant="primary" className="!py-2.5 !px-6 !text-xs">
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </SpecularButton>
            </div>

            {/* Mobile Toggle Button */}
            <button
              className="md:hidden p-2 text-slate-700 hover:text-[#190E85] rounded-xl"
              onClick={() => setMobileOpen(true)}
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Cascading Staggered Menu */}
      <StaggeredMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}