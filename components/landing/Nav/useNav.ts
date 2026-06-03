'use client';
import { useEffect, useState } from 'react';

/** Listens to window scroll and returns whether the nav should become solid. */
export function useNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return { solid };
}
