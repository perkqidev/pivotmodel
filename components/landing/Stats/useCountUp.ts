'use client';
import { useEffect, useRef, useState } from 'react';

/** Counts from 0 to `to` over ~28 ticks, triggered when the element enters the viewport. */
export function useCountUp(to: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          let n = 0;
          const step = Math.max(1, Math.ceil(to / 28));
          const id = setInterval(() => {
            n += step;
            if (n >= to) { n = to; clearInterval(id); }
            setVal(n);
          }, 28);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return { ref, val };
}
