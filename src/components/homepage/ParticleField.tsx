import { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  alpha: number;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const dots: Dot[] = [];
    const COUNT = 80;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init dots
    for (let i = 0; i < COUNT; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: -(Math.random() * 0.4 + 0.15),
        vx: Math.sin(Math.random() * Math.PI * 2) * 0.2,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.2 + 0.08,
      });
    }

    // IntersectionObserver for perf
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const render = () => {
      if (!visibleRef.current) {
        animFrame = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const d of dots) {
        d.y += d.vy;
        d.x += d.vx + Math.sin(d.y * 0.008) * 0.15;

        // Respawn at bottom
        if (d.y < -10) {
          d.y = canvas.height + 10;
          d.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
