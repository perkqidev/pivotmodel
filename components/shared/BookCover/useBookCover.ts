'use client';
import { useEffect, useRef } from 'react';

/** Applies a subtle window-mouse tilt to the 3D book. Disabled under reduced-motion / touch. */
export function useBookCover() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (matchMedia('(hover: none)').matches) return;

    const onMove = (e: MouseEvent) => {
      const rx = (e.clientY / window.innerHeight - 0.5) * -7;
      const ry = (e.clientX / window.innerWidth - 0.5) * 14;
      el.style.transform = `rotateY(${ry - 22}deg) rotateX(${rx + 5}deg)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return ref;
}
