import { useEffect, useRef, useState } from 'react';

export interface SplashCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  COLOR_UPDATE_SPEED?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export function SplashCursor({
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  COLOR_UPDATE_SPEED = 10,
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Check reduced motion & coarse touch pointer
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (prefersReducedMotion || isTouch) {
      setEnabled(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // React Bits tuned palette: Sky Aqua, Neon Violet, Emerald, Electric Royal, White
    const colors = ['#00E0FF', '#CF00FF', '#03CF94', '#190E85', '#FFFFFF'];

    const addParticles = (x: number, y: number, count = 3) => {
      const radiusMult = SPLAT_RADIUS * 12;
      const speedMult = (SPLAT_FORCE / 6000) * 1.5;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 1.2 + 0.3) * speedMult;
        particles.push({
          x: x + (Math.random() - 0.5) * radiusMult,
          y: y + (Math.random() - 0.5) * radiusMult,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 1.2,
          color: colors[Math.floor((Math.random() * colors.length + Date.now() / (1000 / COLOR_UPDATE_SPEED)) % colors.length)],
          alpha: 0.75,
          life: 0,
          maxLife: Math.random() * 25 + 18,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.25) {
        addParticles(e.clientX, e.clientY, 2);
      }
    };

    const handleClick = (e: MouseEvent) => {
      addParticles(e.clientX, e.clientY, 16);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        p.alpha = 0.75 * (1 - p.life / p.maxLife);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animFrame);
    };
  }, [SPLAT_RADIUS, SPLAT_FORCE, COLOR_UPDATE_SPEED]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20 opacity-80"
    />
  );
}
