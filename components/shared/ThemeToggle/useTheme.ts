'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'theme';

/**
 * Unified theme state. Persists to localStorage 'theme' and applies
 * data-theme on <html> so legacy pages (community, assessment, admin)
 * pick up the same value.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      // Dark is the default: only honour an explicit 'light' choice.
      const saved = localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
      setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, theme);
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
  return { theme, setTheme, toggle };
}
