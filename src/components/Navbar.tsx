import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SpecularButton } from "./homepage/SpecularButton";
import { StaggeredMenu } from "./homepage/StaggeredMenu";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 40);
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
            scrolled
              ? "white-glass-navbar py-2.5 px-6 shadow-md"
              : "white-glass-navbar py-3 px-6"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="group flex items-center gap-1"
            >
              <span className="text-lg font-bold text-[#190E85] tracking-tight">
                SmartStore
              </span>
              <span className="text-lg font-serif-italic text-gradient-neon">
                AI
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="relative text-sm text-slate-600 hover:text-[#190E85] font-semibold transition-colors duration-300 group py-1 whitespace-nowrap"
                  activeProps={{ className: "text-[#190E85]" }}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#190E85] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </Link>
              ))}
            </div>

            {/* CTA -> Backend Sign In Page */}
            <div className="hidden md:block">
              <SpecularButton
                href="/login"
                variant="primary"
                className="!py-2.5 !px-6 !text-xs"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </SpecularButton>
            </div>

            {/* Mobile Toggle */}
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

      <StaggeredMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}
