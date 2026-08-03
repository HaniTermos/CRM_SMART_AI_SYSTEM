import { useEffect, useRef } from 'react';

export interface FloatingLinesProps {
  linesGradient?: string[];
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  opacity?: number;
}

export function FloatingLines({
  linesGradient = ['#06B6D4', '#2F4BC0', '#A855F7'],
  animationSpeed = 1,
  interactive = true,
  bendRadius = 6,
  bendStrength = -0.8,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  opacity = 1,
}: FloatingLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const lineSpacing = 50;

    const render = () => {
      time += 0.01 * animationSpeed;

      // Mouse lerp damping
      mouse.x += (mouse.targetX - mouse.x) * mouseDamping;
      mouse.y += (mouse.targetY - mouse.y) * mouseDamping;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numLines = Math.floor(canvas.height / lineSpacing) + 3;

      for (let i = 0; i < numLines; i++) {
        const baseY = i * lineSpacing;
        const color = linesGradient[i % linesGradient.length];

        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(color, 0.12);
        ctx.lineWidth = 1.6;

        for (let x = 0; x <= canvas.width; x += 25) {
          const dx = x - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = bendRadius * 35;

          let bendY = 0;
          if (interactive && dist < maxDist) {
            const factor = (1 - dist / maxDist) * (bendStrength * -25);
            bendY = dy > 0 ? factor : -factor;
          }

          const parallaxOffsetY = parallax ? (mouse.y - canvas.height / 2) * (parallaxStrength * 0.05) : 0;
          const waveY = Math.sin(x * 0.008 + i * 0.5 + time) * 4;

          const y = baseY + bendY + waveY + parallaxOffsetY;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, [linesGradient, animationSpeed, interactive, bendRadius, bendStrength, mouseDamping, parallax, parallaxStrength]);

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
