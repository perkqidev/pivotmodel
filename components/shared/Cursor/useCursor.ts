'use client';
import { useEffect, useRef } from 'react';

/**
 * Custom-cursor logic. Lerps a small dot toward the mouse position via rAF,
 * and sets data-big on the cursor element when it's over interactive targets.
 * Disabled on touch devices and under `prefers-reduced-motion`.
 */
export function useCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noHover = matchMedia('(hover: none)').matches;
    if (reduce || noHover) {
      el.style.display = 'none';
      return;
    }

    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const onOver = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest('a, button, [data-hoverable]')) el.dataset.big = 'true';
    };
    const onOut = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest('a, button, [data-hoverable]')) delete el.dataset.big;
    };

    const loop = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return ref;
}
