import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Animates a number from 0 to `value` (eased). */
export default function CountUp({ value, duration = 900, decimals = 0, suffix = '' }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) { setShown(value); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <>{shown.toFixed(decimals)}{suffix}</>;
}
