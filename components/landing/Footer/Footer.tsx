import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.cols}>
          <div className={styles.brand}>
            <h4>The Pivot Model</h4>
            <p>Engineering excellence, offshore.</p>
          </div>
          <div className={styles.col}>
            <h5>The book</h5>
            <a href="#about">About</a>
            <a href="#concepts">Four pivots</a>
            <a href="#author">Author</a>
            <a href="#insights">Insights</a>
          </div>
          <div className={styles.col}>
            <h5>Community</h5>
            <a href="/community">Materials</a>
            <a href="/community">Whitepapers</a>
            <a href="/community">Blog</a>
            <a href="/assessment">Self-assessment</a>
          </div>
          <div className={styles.col}>
            <h5>Direct</h5>
            <a href="#consulting">Consulting</a>
            <a href="/community">Contact</a>
            <a href="/admin">Admin</a>
          </div>
        </div>
        <div className={styles.row}>
          <span>© {year} The Pivot Model</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
