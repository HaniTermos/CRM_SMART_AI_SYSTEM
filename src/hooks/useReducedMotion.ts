import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isMobile = window.matchMedia('(max-width: 768px)');

    setReduced(mq.matches || isMobile.matches);

    const handler = () => {
      setReduced(mq.matches || isMobile.matches);
    };

    mq.addEventListener('change', handler);
    isMobile.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
      isMobile.removeEventListener('change', handler);
    };
  }, []);

  return reduced;
}
