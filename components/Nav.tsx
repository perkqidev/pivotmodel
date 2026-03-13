'use client';
import { useEffect, useState } from 'react';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          <a href="/community" className="nav-cta">Join Community →</a>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="/#about" onClick={() => setMenuOpen(false)}>About</a>
        <a href="/#concepts" onClick={() => setMenuOpen(false)}>The Model</a>
        <a href="/#author" onClick={() => setMenuOpen(false)}>Author</a>
        <a href="/community" onClick={() => setMenuOpen(false)}>Join Community</a>
      </div>
    </nav>
  );
}
