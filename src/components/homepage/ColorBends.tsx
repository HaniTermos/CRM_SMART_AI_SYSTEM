import { useEffect, useRef } from 'react';

export interface ColorBendsProps {
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  iterations?: number;
  intensity?: number;
  bandWidth?: number;
  opacity?: number;
}

export function ColorBends({
  rotation = 90,
  speed = 0.75,
  colors = ['#CF00FF', '#00E0FF', '#03CF94', '#190E85'],
  transparent = true,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  intensity = 1.5,
  bandWidth = 6,
  opacity = 1,
}: ColorBendsProps) {
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
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left - rect.width / 2) * (mouseInfluence * 0.05);
      mouse.targetY = (e.clientY - rect.top - rect.height / 2) * (mouseInfluence * 0.05);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      time += 0.005 * speed;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const rad = (rotation * Math.PI) / 180;

      // React Bits Background Studio shader wave synthesis
      for (let b = 0; b < bandWidth; b++) {
        const offset = (b / bandWidth) * Math.PI * 2;
        const color = colors[b % colors.length];

        const cx = w / 2 + Math.sin(time * frequency + offset) * 160 * scale + mouse.x * parallax;
        const cy = h / 2 + Math.cos(time * 0.8 * frequency + offset * 1.5) * 140 * scale + mouse.y * parallax;
        const rx = (w * 0.45 * scale + Math.sin(time + offset) * 80 * warpStrength);
        const ry = (h * 0.4 * scale + Math.cos(time * 1.2 + offset) * 70 * warpStrength);

        const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(rx, ry));
        
        // Convert hex color to rgba for smooth gradient transparency
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

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, [rotation, speed, colors, scale, frequency, warpStrength, mouseInfluence, parallax, intensity, bandWidth]);

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
