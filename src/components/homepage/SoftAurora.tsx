import { useEffect, useRef } from 'react';

export interface SoftAuroraProps {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
  opacity?: number;
}

export function SoftAurora({
  speed = 0.6,
  scale = 1.5,
  brightness = 1,
  color1 = '#A855F7',
  color2 = '#3B82F6',
  enableMouseInteraction = true,
  mouseInfluence = 0.25,
  opacity = 1,
}: SoftAuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left - rect.width / 2) * mouseInfluence;
      mouse.targetY = (e.clientY - rect.top - rect.height / 2) * mouseInfluence;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      time += 0.006 * speed;

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // React Bits SoftAurora layer 1 (color1)
      const cx1 = w * 0.35 + Math.sin(time) * 120 * scale + mouse.x;
      const cy1 = h * 0.45 + Math.cos(time * 0.8) * 90 * scale + mouse.y;
      const r1 = Math.min(w, h) * 0.5 * scale;

      const grad1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, r1);
      grad1.addColorStop(0, hexToRgba(color1, 0.16 * brightness));
      grad1.addColorStop(0.6, hexToRgba(color1, 0.06 * brightness));
      grad1.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // React Bits SoftAurora layer 2 (color2)
      const cx2 = w * 0.65 + Math.cos(time * 0.7) * 110 * scale - mouse.x;
      const cy2 = h * 0.55 + Math.sin(time * 0.9) * 100 * scale - mouse.y;
      const r2 = Math.min(w, h) * 0.55 * scale;

      const grad2 = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, r2);
      grad2.addColorStop(0, hexToRgba(color2, 0.14 * brightness));
      grad2.addColorStop(0.6, hexToRgba(color2, 0.05 * brightness));
      grad2.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, [speed, scale, brightness, color1, color2, enableMouseInteraction, mouseInfluence]);

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
