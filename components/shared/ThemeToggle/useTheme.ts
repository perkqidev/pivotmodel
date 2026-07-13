'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
// New key (v2): the old 'theme' key was auto-persisted on every mount back
// when light was the default, so returning browsers have a stale 'light'
// saved. Using a fresh key means that stale value is ignored and dark is the
// real default; we only write here when the user *explicitly* toggles.
const KEY = 'theme-pref';

/**
 * Unified theme state. Dark is the default. Persists an explicit choice to
 * localStorage and applies data-theme on <html> so legacy pages (community,
 * assessment, admin) pick up the same value.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Hydrate from an explicit saved choice; absence => dark default.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // Reflect the current theme onto <html> for the legacy token system.
  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, [theme]);

  const persist = (t: Theme) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
  };
  const setTheme = (t: Theme) => {
    setThemeState(t);
    persist(t);
  };
  const toggle = () =>
    setThemeState(t => {
      const next = t === 'light' ? 'dark' : 'light';
      persist(next);
      return next;
    });

  return { theme, setTheme, toggle };
}
