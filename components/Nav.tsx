'use client';
import { useEffect, useState, useRef } from 'react';
import Icon from '@/components/Icon';

interface NavUser { id: number; name: string; email: string; isAdmin: boolean; }

export default function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [user, setUser]           = useState<NavUser | null>(null);
  const [dropOpen, setDropOpen]   = useState(false);
  const [theme, setTheme]         = useState('dark');
  const dropRef                   = useRef<HTMLDivElement>(null);

  /* scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* load theme — dark is the default; only an explicit saved value overrides */
  useEffect(() => {
    const saved = localStorage.getItem('theme-pref');
    const resolved = saved === 'light' ? 'light' : 'dark';
    setTheme(resolved);
    if (resolved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme-pref', next);
  }

  /* load session once */
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
    }).catch(() => {});
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
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
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="/" className="nav-logo" aria-label="The Pivot Model — home"><img src="/logo.png" alt="The Pivot Model" /></a>

        <div className="nav-links">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Icon name="sun" size={16} /> : <Icon name="moon" size={16} />}
          </button>

          {user ? (
            <div className="nav-user-wrap" ref={dropRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropOpen(o => !o)}
                aria-label="Account menu"
              >
                <span className="nav-user-avatar">{firstName[0]?.toUpperCase()}</span>
                <span className="nav-user-name">{firstName}</span>
                <span className="nav-user-chevron" style={{ display:'inline-flex' }}><Icon name="chevron" size={13} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }} /></span>
              </button>

              {dropOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <div className="nav-dd-name">{user.name}</div>
                    <div className="nav-dd-email">{user.email}</div>
                  </div>
                  <a href="/community" className="nav-dd-item" style={{ display:'flex',alignItems:'center',gap:10 }} onClick={() => setDropOpen(false)}>
                    <Icon name="grid" size={16} /> Community &amp; Tools
                  </a>
                  {user.isAdmin && (
                    <a href="/admin" className="nav-dd-item" style={{ display:'flex',alignItems:'center',gap:10 }} onClick={() => setDropOpen(false)}>
                      <Icon name="shield" size={16} /> Admin Panel
                    </a>
                  )}
                  <div className="nav-dd-divider" />
                  <button className="nav-dd-item nav-dd-logout" onClick={logout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/community" className="nav-cta">Join Community →</a>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <button className="theme-toggle" onClick={toggleTheme} style={{ margin:'8px 32px' }}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {user ? (
          <>
            <a href="/community" onClick={() => setMenuOpen(false)}>Community</a>
            <button style={{ background:'none', border:'none', color:'var(--gold)', fontSize:14, cursor:'pointer', padding:'10px 32px', textAlign:'left', width:'100%' }} onClick={logout}>Sign Out</button>
          </>
        ) : (
          <a href="/community" onClick={() => setMenuOpen(false)}>Join Community</a>
        )}
      </div>
    </nav>
  );
}
