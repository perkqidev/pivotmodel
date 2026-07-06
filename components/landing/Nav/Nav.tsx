'use client';
import { useState, useEffect } from 'react';
import styles from './Nav.module.css';
import { useNav } from './useNav';

export function Nav() {
  const { solid } = useNav();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); }).catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <nav className={styles.nav} data-solid={solid}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>The Pivot <em>Model</em></a>
        <div className={styles.links}>
          <a href="#mani">The Book</a>
          <a href="#framework">Framework</a>
          <a href="#author">Author</a>
          {user
            ? <a href="/community" className={styles.cta}>{firstName ? `${firstName} · Community` : 'Community'}</a>
            : <a href="/community" className={styles.cta}>Get access</a>}
        </div>
      </div>
    </nav>
  );
}
