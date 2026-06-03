'use client';
import styles from './Stats.module.css';
import { useCountUp } from './useCountUp';

function Count({ to, suf }: { to: number; suf?: string }) {
  const { ref, val } = useCountUp(to);
  return <span ref={ref}>{val}{suf && <span className={styles.suf}>{suf}</span>}</span>;
}

export function Stats() {
  return (
    <section className={styles.stats}>
      <div className={styles.grid}>
        <div className={styles.item}>
          <div className={styles.n}><Count to={25} suf="+" /></div>
          <div className={styles.l}>Years of offshore engineering experience distilled</div>
        </div>
        <div className={styles.item}>
          <div className={styles.n}><Count to={4} /></div>
          <div className={styles.l}>Core pivot pillars for operational excellence</div>
        </div>
        <div className={styles.item}>
          <div className={styles.n}><Count to={3} /></div>
          <div className={styles.l}>Maturity levels with clear, measurable benchmarks</div>
        </div>
        <div className={styles.item}>
          <div className={styles.n}>∞</div>
          <div className={styles.l}>Potential unlocked when offshore teams truly thrive</div>
        </div>
      </div>
    </section>
  );
}
