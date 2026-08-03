import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpecularButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'outline';
}

export function SpecularButton({
  children,
  href,
  onClick,
  className = '',
  variant = 'primary',
}: SpecularButtonProps) {
  const btnRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.2;
    const deltaY = (e.clientY - centerY) * 0.2;
    setBtnPos({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setBtnPos({ x: 0, y: 0 });
  };

  const baseStyles = variant === 'primary'
    ? 'bg-[#190E85] text-white shadow-[0_10px_30px_rgba(25,14,133,0.3)] hover:shadow-[0_15px_40px_rgba(25,14,133,0.4)]'
    : 'bg-white/80 text-[#0F172A] border border-slate-200/80 shadow-sm hover:border-[#00E0FF]/50 hover:bg-white';

  const content = (
    <motion.div
      animate={{ x: btnPos.x, y: btnPos.y }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
      className={`specular-shimmer-light inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 ${baseStyles} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a
        ref={btnRef as any}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={btnRef as any}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {content}
    </button>
  );
}
