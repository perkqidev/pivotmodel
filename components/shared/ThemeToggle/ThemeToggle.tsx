'use client';
import styles from './ThemeToggle.module.css';
import Icon from '@/components/Icon';

interface Props {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button type="button" className={styles.toggle} onClick={onToggle} aria-label="Toggle theme">
      {theme === 'dark' ? <Icon name="sun" size={16} /> : <Icon name="moon" size={16} />}
    </button>
  );
}
