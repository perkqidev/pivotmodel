import styles from './FinalCTA.module.css';

export function FinalCTA() {
  return (
    <section className={styles.final}>
      <div className={styles.wrap}>
        <div className={styles.orn}>◆ ◆ ◆</div>
        <h2 className={styles.h}>Your team’s AI future<br/>starts with <strong>maturity.</strong></h2>
        <p className={styles.lead}>
          The engineering leaders who act now — building the right foundations before the AI wave
          peaks — will define the next decade of product development. Join the community. Get the
          frameworks. Start today.
        </p>
        <a href="/community" className={styles.cta}>
          Get started — it’s free <span className={styles.ar}>→</span>
        </a>
        <div className={styles.note}>No payment. No commitment. Just the work.</div>
      </div>
    </section>
  );
}
