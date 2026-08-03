import { useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMousePosition } from '../hooks/useMousePosition';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverLift?: boolean;
}

export function GlassCard({
  children,
  className = '',
  delay = 0,
  hoverLift = true,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition(cardRef);

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        hoverLift
          ? {
            y: -4,
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }
          : undefined
      }
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(40px) saturate(120%)',
        WebkitBackdropFilter: 'blur(40px) saturate(120%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Specular highlight on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mouse.normalizedX * 100}% ${mouse.normalizedY * 100}%, rgba(255,255,255,0.06), transparent 40%)`,
          borderRadius: '24px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}