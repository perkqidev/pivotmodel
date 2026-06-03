import styles from './Ladder.module.css';

interface Props { theme: 'light' | 'dark'; }

export function Ladder({ theme }: Props) {
  const img = theme === 'dark' ? '/img/aero-ladder-dark.svg' : '/img/aero-ladder.svg';
  return (
    <section className={styles.ladder}>
      <div className={styles.wrap}>
        <div className={styles.img}><img src={img} alt="L1 → L2 → L3 maturity ladder" /></div>
        <div>
          <div>
            <div className={styles.label}>03 / 05&nbsp;&nbsp;The maturity ladder</div>
            <h2 className={styles.h}>Where is your team <strong>on the journey?</strong></h2>
            <p className={styles.lead}>
              Three engineering maturity levels — each with clear competency benchmarks, performance KRAs and a
              concrete path forward. Stop guessing. Start measuring.
            </p>
            <a href="/community" className={styles.cta}>
              Get the full EMB framework <span className={styles.ar}>→</span>
            </a>
          </div>
          <div className={styles.lv}>
            <div className={styles.c}>L1</div>
            <div><h4>Execution Layer</h4>
              <p>Task-focused delivery. Dependent on direction. Building basic engineering habits.</p></div>
          </div>
          <div className={styles.lv}>
            <div className={styles.c}>L2</div>
            <div><h4>Engineering Ownership</h4>
              <p>Self-directed quality. Proactive communication. Beginning to shape the product.</p></div>
          </div>
          <div className={styles.lv} data-on="true">
            <div className={styles.c}>L3</div>
            <div><h4>Strategic Partnership</h4>
              <p>Business-aware engineering. Thought leadership. Driving innovation from offshore.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
