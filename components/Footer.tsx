export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">The Pivot <em>Model</em></div>
          <div className="footer-tagline">Engineering Excellence, Offshore.</div>
        </div>
        <div className="footer-links">
          <a href="/#about">About the Book</a>
          <a href="/#concepts">The Framework</a>
          <a href="/community">Community</a>
          <a href="/community">Materials</a>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} The Pivot Model. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
