'use client';
import styles from './Nav.module.css';
import { useNav } from './useNav';

export function Nav() {
  const { solid } = useNav();
  return (
    <nav className={styles.nav} data-solid={solid}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>The Pivot <em>Model</em></a>
        <div className={styles.links}>
          <a href="#mani">The Book</a>
          <a href="#framework">Framework</a>
          <a href="#author">Author</a>
          <a href="/community" className={styles.cta}>Get access</a>
        </div>
      </div>
    </nav>
  );
}
