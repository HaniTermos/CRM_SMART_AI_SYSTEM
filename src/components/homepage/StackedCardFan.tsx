import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Users, Globe, Shield } from 'lucide-react';

interface StackCard {
  id: number;
  title: string;
  stat: string;
  description: string;
  icon: any;
  color: string;
}

const CARDS: StackCard[] = [
  { id: 1, title: 'Revenue Tracking', stat: '$4.8M+', description: 'GMV processed this quarter', icon: BarChart3, color: '#C9A96E' },
  { id: 2, title: 'Active Merchants', stat: '2,400+', description: 'Businesses using SmartStore AI', icon: Users, color: '#E5C384' },
  { id: 3, title: 'Storefronts Deployed', stat: '12,000+', description: 'Live stores across 40 countries', icon: Globe, color: '#8BD5CA' },
  { id: 4, title: 'AI Predictions', stat: '98.4%', description: 'Demand scoring accuracy rate', icon: Zap, color: '#C4B5FD' },
  { id: 5, title: 'Uptime Guarantee', stat: '99.99%', description: 'Enterprise-grade reliability', icon: Shield, color: '#FCA5A5' },
];

export function StackedCardFan() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-32 md:py-48 z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs uppercase font-mono tracking-[0.2em] text-[#C9A96E] mb-4 block">
            By the Numbers
          </span>
          <h2 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-[1.08] mb-6">
            Trusted by teams <br />
            <span className="font-serif-italic font-normal gold-gradient-text">
              building the future
            </span>
          </h2>
        </motion.div>

        {/* Stacked Cards */}
        <div
          className="relative flex items-center justify-center h-[380px] md:h-[420px] cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {CARDS.map((card, i) => {
            const total = CARDS.length;
            const mid = Math.floor(total / 2);

            // Stacked: slight offset
            const stackedY = i * -4;
            const stackedScale = 1 - i * 0.02;

            // Fan: spread out
            const fanRotation = (i - mid) * 8;
            const fanX = (i - mid) * 120;
            const fanY = Math.abs(i - mid) * 15;

            const Icon = card.icon;

            return (
              <motion.div
                key={card.id}
                className="absolute glass-card-deep w-[300px] md:w-[340px] h-[320px] md:h-[360px] p-8 flex flex-col justify-between"
                animate={{
                  x: isHovered ? fanX : 0,
                  y: isHovered ? fanY : stackedY,
                  rotate: isHovered ? fanRotation : 0,
                  scale: isHovered ? 1 : stackedScale,
                  zIndex: isHovered ? total - Math.abs(i - mid) : total - i,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 22,
                }}
                style={{ zIndex: total - i }}
                whileHover={isHovered ? { scale: 1.05, y: fanY - 10 } : {}}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>

                {/* Content */}
                <div>
                  <div
                    className="text-4xl md:text-5xl font-bold tracking-tight mb-2 tabular-nums"
                    style={{ color: card.color }}
                  >
                    {card.stat}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{card.title}</h3>
                  <p className="text-sm text-white/50">{card.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Hint */}
        <motion.p
          className="text-center text-xs text-white/20 font-mono mt-6 tracking-wider"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Hover to fan out cards
        </motion.p>
      </div>
    </section>
  );
}
