// HeroSection.tsx
export default function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <div className="hero-grid" />
        <div className="noise-overlay" />
      </div>
      <div className="hero-inner">
        <div className="hero-text">
          <div className="ai-era-badge reveal">
            <span className="ai-pulse" />
            Essential reading for the Age of AI
          </div>
          <div className="hero-eyebrow reveal">The Framework for Offshore Engineering Excellence</div>
          <h1 className="hero-title reveal">
            <span className="title-line">The</span>
            <span className="title-line accent-gold">Pivot</span>
            <span className="title-line">Model</span>
          </h1>
          <p className="hero-sub reveal">
            AI is reshaping every engineering team on earth.<br />
            The teams that thrive will be those built on <strong>engineering maturity</strong> —<br />
            not just headcount or tools.
          </p>
          <div className="hero-actions reveal">
            <a href="/community" className="btn btn-primary">Get Access + Join Community</a>
            <a href="#ai-age" className="btn btn-ghost">Why AI Makes This Urgent ↓</a>
          </div>
        </div>
        <div className="hero-book reveal">
          <div className="book-3d">
            <div className="book-face">
              <div className="book-content">
                <div className="book-ornament">◆</div>
                <div className="book-tag">THE FRAMEWORK</div>
                <div className="book-title-small">THE<br />PIVOT<br />MODEL</div>
                <div className="book-divider" />
                <div className="book-sub-small">Engineering Excellence<br />for Offshore Teams</div>
                <div className="book-ornament-bottom">◆ ◆ ◆</div>
              </div>
            </div>
            <div className="book-spine"><span>THE PIVOT MODEL</span></div>
            <div className="book-side" />
          </div>
          <div className="book-shadow" />
        </div>
      </div>
      <div className="hero-scroll-hint" style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.4 }}>
        <span style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--muted)' }}>Scroll</span>
        <div style={{ width: 1, height: 40, background: 'var(--muted)' }} />
      </div>
    </section>
  );
}
