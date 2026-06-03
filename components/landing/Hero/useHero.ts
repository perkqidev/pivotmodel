'use client';
import { useEffect, useState } from 'react';

/** Triggers the hero load reveal sequence shortly after mount.
 *  Returns `shown` which the Hero component spreads onto its animated children
 *  via `data-shown`. */
export function useHero() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 120);
    return () => clearTimeout(t);
  }, []);
  return { shown };
}
