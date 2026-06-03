'use client';
import styles from './Cursor.module.css';
import { useCursor } from './useCursor';

export function Cursor() {
  const ref = useCursor();
  return <div ref={ref} className={styles.cursor} aria-hidden />;
}
