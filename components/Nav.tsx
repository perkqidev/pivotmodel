'use client';
import { useEffect, useState, useRef } from 'react';

interface NavUser { id: number; name: string; email: string; isAdmin: boolean; }

export default function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [user, setUser]           = useState<NavUser | null>(null);
  const [dropOpen, setDropOpen]   = useState(false);
  const dropRef                   = useRef<HTMLDivElement>(null);

  /* scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <a href="/" className="nav-logo">THE PIVOT MODEL</a>

        <div className="nav-links">
          <a href="/#about">About</a>
          <a href="/#concepts">The Model</a>
          <a href="/#ai-age">AI &amp; Engineering</a>
          <a href="/#author">Author</a>
          <a href="/#insights">Insights</a>
          <a href="/#consulting" style={{ color: 'var(--gold)', fontWeight: 600 }}>Book Consulting</a>

          {user ? (
            <div className="nav-user-wrap" ref={dropRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropOpen(o => !o)}
                aria-label="Account menu"
              >
                <span className="nav-user-avatar">{firstName[0]?.toUpperCase()}</span>
                <span className="nav-user-name">{firstName}</span>
                <span className="nav-user-chevron">{dropOpen ? '▲' : '▼'}</span>
              </button>

              {dropOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <div className="nav-dd-name">{user.name}</div>
                    <div className="nav-dd-email">{user.email}</div>
                  </div>
                  <a href="/community" className="nav-dd-item" onClick={() => setDropOpen(false)}>
                    📊 Community &amp; Tools
                  </a>
                  {user.isAdmin && (
                    <a href="/admin" className="nav-dd-item" onClick={() => setDropOpen(false)}>
                      ⚙ Admin Panel
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
        <a href="/#about"    onClick={() => setMenuOpen(false)}>About</a>
        <a href="/#concepts" onClick={() => setMenuOpen(false)}>The Model</a>
        <a href="/#author"   onClick={() => setMenuOpen(false)}>Author</a>
        {user ? (
          <>
            <a href="/community" onClick={() => setMenuOpen(false)}>Community</a>
            <button style={{ background:'none', border:'none', color:'var(--gold)', fontSize:14, cursor:'pointer', padding:'10px 0', textAlign:'left' }} onClick={logout}>Sign Out</button>
          </>
        ) : (
          <a href="/community" onClick={() => setMenuOpen(false)}>Join Community</a>
        )}
      </div>
    </nav>
  );
}
