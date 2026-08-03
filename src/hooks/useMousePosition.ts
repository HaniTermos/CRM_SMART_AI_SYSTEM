import { useState, useEffect, RefObject } from 'react';

export function useMousePosition(targetRef?: RefObject<HTMLElement | null>) {
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
    normalizedX: 0.5,
    normalizedY: 0.5,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (targetRef && targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const normalizedX = Math.max(0, Math.min(1, x / (rect.width || 1)));
        const normalizedY = Math.max(0, Math.min(1, y / (rect.height || 1)));
        setMousePosition({ x, y, normalizedX, normalizedY });
      } else {
        const x = event.clientX;
        const y = event.clientY;
        const normalizedX = window.innerWidth > 0 ? x / window.innerWidth : 0.5;
        const normalizedY = window.innerHeight > 0 ? y / window.innerHeight : 0.5;
        setMousePosition({ x, y, normalizedX, normalizedY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [targetRef]);

  return mousePosition;
}