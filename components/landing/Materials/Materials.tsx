import styles from './Materials.module.css';

interface Props { theme: 'light' | 'dark'; }

const MATERIALS = [
  { n: '01', h: 'EMB Schema Templates',
    p: 'Custom Engineering Maturity Benchmark worksheets — ready to adapt for your organisation.',
    lock: 'Members only' },
  { n: '02', h: 'KRA & Performance Frameworks',
    p: 'Role-by-role Key Result Areas aligned to the four pivots, with scoring rubrics.',
    lock: 'Members only' },
  { n: '03', h: 'Offshore Setup Playbooks',
    p: 'Captive vs third-party decision trees, engagement guides and onboarding frameworks.',
    lock: 'Members only' },
  { n: '04', h: 'Self-Assessment Tools',
    p: 'Quick-score your team’s maturity across all four pivots in under 20 minutes.',
    lock: 'Members only' },
  { n: '05', h: 'AI Impact Guides',
    p: 'Practical guides to navigating the three phases of AI’s impact on engineering talent.',
    lock: 'Members only' },
  { n: '06', h: 'Whitepapers & Research',
    p: 'In-depth frameworks and research on offshore engineering excellence.',
    lock: 'Free & member tiers' },
];

export function Materials({ theme }: Props) {
  const suf = theme === 'dark' ? '-dark' : '';
  return (
    <section className={styles.materials}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h2>Join the community. <strong>Get the full toolkit.</strong></h2>
          <p>Register free to unlock downloadable frameworks, templates, and a growing community of product engineering leaders tackling the same challenges you are.</p>
        </div>
        <div className={styles.grid}>
          {MATERIALS.map((m, i) => (
            <div key={m.n} className={styles.mat}>
              <div className={styles.matPh}><img src={`/img/aero-m${i + 1}${suf}.svg`} alt="" /></div>
              <div className={styles.matIn}>
                <div className={styles.mn}>{m.n}</div>
                <h4>{m.h}</h4>
                <p>{m.p}</p>
                <div className={styles.lock}>{m.lock}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.cta}>
          <a href="/community" className={styles.bigBtn}>
            Register free &amp; unlock everything <span className={styles.ar}>→</span>
          </a>
          <div className={styles.note}>No payment required. Just a passion for engineering excellence.</div>
        </div>
      </div>
    </section>
  );
}
