import { useEffect, useRef } from 'react';

export function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animFrame: number;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 40;
      const y = (clientY / window.innerHeight - 0.5) * 40;
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    const animate = () => {
      time += 0.005;
      if (containerRef.current) {
        containerRef.current.style.setProperty('--time', `${time}`);
      }
      animFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505]"
      style={{
        ['--mouse-x' as string]: '0px',
        ['--mouse-y' as string]: '0px',
      }}
    >
      {/* Aurora Layer 1 — Deep Violet Radial */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full opacity-35 blur-[120px] transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(99, 44, 255, 0.4) 0%, rgba(20, 10, 45, 0) 70%)',
          transform: 'translate(var(--mouse-x), var(--mouse-y))',
        }}
      />

      {/* Aurora Layer 2 — Gold Accent Blob */}
      <div
        className="absolute top-[10%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-25 blur-[140px] transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(201, 169, 110, 0.4) 0%, rgba(40, 30, 10, 0) 70%)',
          transform: 'translate(calc(var(--mouse-x) * -1.2), calc(var(--mouse-y) * -1.2))',
        }}
      />

      {/* Aurora Layer 3 — Deep Teal Mesh */}
      <div
        className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[60vw] rounded-full opacity-20 blur-[160px] transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(5, 5, 20, 0) 70%)',
          transform: 'translate(calc(var(--mouse-x) * 0.8), calc(var(--mouse-y) * 0.8))',
        }}
      />

      {/* Grid overlay for spatial depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}
