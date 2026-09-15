import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { SpecularButton } from './SpecularButton';

interface NavLink {
  label: string;
  href: string;
}

interface StaggeredMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
}

export function StaggeredMenu({ isOpen, onClose, links }: StaggeredMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-2xl md:hidden flex flex-col justify-between p-8 pointer-events-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-[#190E85]">SmartStore</span>
              <span className="text-xl font-serif-italic text-gradient-neon">AI</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cascading Staggered Links */}
          <div className="flex flex-col space-y-6 my-auto">
            {links.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={onClose}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-3xl font-bold text-slate-900 hover:text-[#190E85] transition-colors flex items-center justify-between group"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-[#190E85] group-hover:translate-x-1 transition-all" />
              </motion.a>
            ))}
          </div>

          {/* CTA Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="pt-6 border-t border-slate-200"
          >
            <SpecularButton href="/login" onClick={onClose} className="w-full">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </SpecularButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
