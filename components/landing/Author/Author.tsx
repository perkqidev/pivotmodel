import styles from './Author.module.css';

export function Author() {
  return (
    <section id="author" className={styles.author}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          <div className={styles.portrait}>
            <div className={styles.frame}>
              <div className={styles.initials}>PM</div>
            </div>
            <div className={styles.quote}>
              “Intuition-based engineering is injurious to software quality.”
            </div>
          </div>
          <div className={styles.bio}>
            <div className={styles.label}>About the author</div>
            <h2 className={styles.h}>25+ years building <strong>world-class teams.</strong></h2>
            <p>
              The author’s career spans some of the finest engineering environments across India and
              the global stage — from Verifone in the 1990s, widely considered one of India’s premier
              product engineering cultures, to the Vista Equity Partners management ecosystem and
              numerous global engineering transformations.
            </p>
            <p>
              The Pivot Model is the distillation of those decades — a rigorous, practical framework
              for any leader who refuses to accept “good enough” from their offshore engineering
              operation.
            </p>
            <a href="/community" className={styles.cta}>
              Connect in the community <span className={styles.ar}>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
