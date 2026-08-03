import { Sparkles } from 'lucide-react';

interface CircularBadgeProps {
  text?: string;
  className?: string;
  isHovered?: boolean;
}

export function CircularBadge({
  text = '• SMARTSTORE AI • COMMERCE REIMAGINED ',
  className = '',
  isHovered = false,
}: CircularBadgeProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Rotating SVG Text */}
      <svg
        viewBox="0 0 160 160"
        className={`w-32 h-32 md:w-40 md:h-40 ${
          isHovered ? 'animate-[spin-slow_8s_linear_infinite]' : 'animate-[spin-slow_16s_linear_infinite]'
        } transition-all duration-700`}
      >
        <path
          id="circlePath"
          d="M 80, 80 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0"
          fill="none"
        />
        <text className="text-[10px] uppercase font-mono tracking-[0.22em] fill-[#190E85] font-semibold">
          <textPath href="#circlePath" startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>

      {/* Center White-Glass Sphere */}
      <div className="absolute inset-0 m-auto w-12 h-12 rounded-full white-glass-panel flex items-center justify-center shadow-[0_0_20px_rgba(0,224,255,0.4)] border border-white">
        <Sparkles className="w-5 h-5 text-[#00E0FF]" />
      </div>
    </div>
  );
}
