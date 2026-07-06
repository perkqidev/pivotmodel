'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './Nav.module.css';
import { useNav } from './useNav';
import Icon from '@/components/Icon';

interface NavUser { id: number; name: string; email: string; isAdmin: boolean }

export function Nav() {
  const { solid } = useNav();
  const [user, setUser] = useState<NavUser | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); }).catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setUser(null);
    setDropOpen(false);
    window.location.href = '/';
  }

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <nav className={styles.nav} data-solid={solid}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>The Pivot <em>Model</em></a>
        <div className={styles.links}>
          <a href="#mani">The Book</a>
          <a href="#framework">Framework</a>
          <a href="#author">Author</a>
          {user ? (
            <div className="nav-user-wrap" ref={dropRef}>
              <button className="nav-user-btn" onClick={() => setDropOpen(o => !o)} aria-label="Account menu">
                <span className="nav-user-avatar">{firstName[0]?.toUpperCase()}</span>
                <span className="nav-user-name">{firstName}</span>
                <span className="nav-user-chevron" style={{ display: 'inline-flex' }}>
                  <Icon name="chevron" size={13} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </span>
              </button>
              {dropOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <div className="nav-dd-name">{user.name}</div>
                    <div className="nav-dd-email">{user.email}</div>
                  </div>
                  <a href="/community" className="nav-dd-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setDropOpen(false)}>
                    <Icon name="grid" size={16} /> Community &amp; Tools
                  </a>
                  {user.isAdmin && (
                    <a href="/admin" className="nav-dd-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setDropOpen(false)}>
                      <Icon name="shield" size={16} /> Admin Panel
                    </a>
                  )}
                  <div className="nav-dd-divider" />
                  <button className="nav-dd-item nav-dd-logout" onClick={logout}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <a href="/community" className={styles.cta}>Get access</a>
          )}
        </div>
      </div>
    </nav>
  );
}
