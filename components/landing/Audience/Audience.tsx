import styles from './Audience.module.css';

interface Props { theme: 'light' | 'dark'; }

const CARDS = [
  { img: 'aero-aud1', h: 'Engineering Leaders',
    p: 'CTOs, VPs of Engineering and product leaders building or optimising offshore teams.' },
  { img: 'aero-aud2', h: 'Product Companies',
    p: 'Companies with engineering operations in India, Eastern Europe, or anywhere offsite.' },
  { img: 'aero-aud3', h: 'Growth-Stage Orgs',
    p: 'Scaling teams that need rigour, repeatability and results — not headcount alone.' },
];

export function Audience({ theme }: Props) {
  const suf = theme === 'dark' ? '-dark' : '';
  return (
    <section className={styles.aud}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h2>Built for the leaders who <strong>own the outcome.</strong></h2>
          <p>— Who the Pivot Model is for</p>
        </div>
        <div className={styles.grid}>
          {CARDS.map(c => (
            <div key={c.h} className={styles.card}>
              <div className={styles.img}><img src={`/img/${c.img}${suf}.svg`} alt="" /></div>
              <div className={styles.lab}>For</div>
              <h4>{c.h}</h4>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
