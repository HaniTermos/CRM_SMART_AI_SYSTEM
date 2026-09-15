import { useEffect, useRef } from 'react';

export interface ColorBendsProps {
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  intensity?: number;
  bandWidth?: number;
  opacity?: number;
}

const DEFAULT_COLORS = ['#CF00FF', '#00E0FF', '#03CF94', '#190E85'];

export function ColorBends({
  rotation = 90,
  speed = 0.75,
  colors = DEFAULT_COLORS,
  transparent = true,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  intensity = 1.5,
  bandWidth = 6,
  opacity = 1,
}: ColorBendsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Keep latest props in a ref to avoid resetting the animation loop on prop updates
  const propsRef = useRef({
    rotation,
    speed,
    colors,
    transparent,
    scale,
    frequency,
    warpStrength,
    intensity,
    bandWidth,
  });

  useEffect(() => {
    propsRef.current = {
      rotation,
      speed,
      colors,
      transparent,
      scale,
      frequency,
      warpStrength,
      intensity,
      bandWidth,
    };
  }, [rotation, speed, colors, transparent, scale, frequency, warpStrength, intensity, bandWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isPaused = false;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (timestamp: number) => {
      if (isPaused) return;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Accumulate time continuously — timeRef.current persists forever and never resets to 0
      const currentSpeed = propsRef.current.speed;
      timeRef.current += delta * currentSpeed;

      const time = timeRef.current;
      const { rotation, colors, scale, frequency, warpStrength, intensity, bandWidth } = propsRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const rad = (rotation * Math.PI) / 180;

      // Continuous mathematical wave synthesis (infinite, smooth, non-cursor-driven)
      for (let b = 0; b < bandWidth; b++) {
        const offset = (b / bandWidth) * Math.PI * 2;
        const color = colors[b % colors.length];

        const cx = w / 2 + Math.sin(time * frequency + offset) * 160 * scale;
        const cy = h / 2 + Math.cos(time * 0.8 * frequency + offset * 1.5) * 140 * scale;
        const rx = w * 0.45 * scale + Math.sin(time + offset) * 80 * warpStrength;
        const ry = h * 0.4 * scale + Math.cos(time * 1.2 + offset) * 70 * warpStrength;

        const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(rx, ry));

        grad.addColorStop(0, hexToRgba(color, 0.22 * intensity));
        grad.addColorStop(0.5, hexToRgba(color, 0.1 * intensity));
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad + Math.sin(time * 0.5 + offset) * 0.2);
        ctx.translate(-cx, -cy);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    // Handle page visibility correctly using document.visibilitychange
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else {
        if (isPaused) {
          isPaused = false;
          lastTimeRef.current = null; // Reset delta timestamp baseline so time doesn't jump
          animFrameRef.current = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 z-0"
      style={{ opacity }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
