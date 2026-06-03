'use client';
import styles from './ThemeToggle.module.css';

interface Props {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const label = theme === 'light' ? 'Dark mode →' : '← Light mode';
  return (
    <button type="button" className={styles.toggle} onClick={onToggle} aria-label="Toggle theme">
      {label}
    </button>
  );
}
