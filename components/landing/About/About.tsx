import styles from './About.module.css';

interface Props { theme: 'light' | 'dark'; }

export function About({ theme }: Props) {
  const img = theme === 'dark' ? '/img/aero-mani-dark.svg' : '/img/aero-mani.svg';
  return (
    <section id="mani" className={styles.about}>
      <div className={styles.inner}>
        <div>
          <div className={styles.label}>01 / 05&nbsp;&nbsp;What this book is about</div>
          <h2 className={styles.h}>
            Offshore teams fail for <strong>predictable</strong> reasons —
            and that&apos;s exactly why they can be fixed.
          </h2>
          <div className={styles.body}>
            <p>
              Most companies set up offshore engineering teams to cut costs — and end up with exactly what they
              paid for. The Pivot Model is a battle-tested framework that reframes the entire conversation:
              offshore teams aren&apos;t a compromise, they&apos;re a{' '}
              <strong>strategic advantage waiting to be unlocked.</strong>
            </p>
            <p>
              Built on over two decades of real-world experience building world-class product engineering operations
              across India, the US, and Europe, this book gives engineering leaders the vocabulary, structure,
              and practical tools to stop firefighting and start building something that lasts.
            </p>
          </div>
          <a href="/community" className={styles.cta}>
            Register &amp; access materials <span className={styles.ar}>→</span>
          </a>
        </div>
        <div className={styles.img}>
          <img src={img} alt="The four pivots diagram" />
        </div>
      </div>
    </section>
  );
}
