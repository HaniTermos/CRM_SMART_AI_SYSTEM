import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_MESSAGES = [
  'Scoring demand signals...',
  'Analyzing product inventory...',
  'Booting SmartStore AI...',
];

export function PageLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'revealing' | 'done'>('loading');

  const handleComplete = useCallback(() => {
    setPhase('revealing');
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800);
  }, [onComplete]);

  // Fast 2.2s total boot sequence
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000; // 2 seconds fill

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 35) setStatusIdx(0);
      else if (pct < 75) setStatusIdx(1);
      else setStatusIdx(2);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(handleComplete, 200);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [handleComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col pointer-events-auto"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top Curtain Half (White Base) */}
          <motion.div
            className="flex-1 bg-white relative flex items-end justify-center overflow-hidden"
            animate={phase === 'revealing' ? { y: '-100%' } : { y: '0%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Center SoftAurora Blob Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[350px] h-[350px] rounded-full bg-gradient-radial from-[#00E0FF]/25 via-[#190E85]/15 to-transparent blur-3xl animate-pulse" />
            </div>

            {/* Main Brand + Status Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
              {/* Brand Typography */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold tracking-tight text-[#190E85]"
                >
                  SmartStore
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl md:text-4xl font-serif-italic text-gradient-neon font-normal"
                >
                  AI Engine
                </motion.div>
              </div>

              {/* Status Text Cycle */}
              <div className="h-6 mb-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={statusIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs font-mono-metrics tracking-wider text-slate-500 uppercase"
                  >
                    {STATUS_MESSAGES[statusIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Neon Progress Bar */}
              <div className="w-56 h-[3px] bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: 'linear-gradient(90deg, #190E85 0%, #CF00FF 70%, #00E0FF 100%)',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                >
                  {/* Sky Aqua Leading Edge Glow */}
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#00E0FF] shadow-[0_0_10px_#00E0FF]" />
                </motion.div>
              </div>

              {/* Counter percentage */}
              <div className="mt-3 text-[11px] font-mono-metrics text-slate-400 tracking-widest tabular-nums">
                {String(progress).padStart(3, '0')}%
              </div>
            </div>
          </motion.div>

          {/* Bottom Curtain Half (White Base) */}
          <motion.div
            className="flex-1 bg-white"
            animate={phase === 'revealing' ? { y: '100%' } : { y: '0%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
