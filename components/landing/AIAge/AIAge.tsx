import styles from './AIAge.module.css';

const PHASES = [
  { n: 'Phase 1', h: 'AI-Augmented Traditional Development',
    p: 'Copilot, code review, documentation — the tools are here. Does your team have the engineering discipline to use them effectively?',
    status: 'Happening now', now: true },
  { n: 'Phase 2', h: 'Traditional Products with AI Features',
    p: 'Your customers expect AI capabilities. Building them well requires product maturity, not just model APIs and good intentions.',
    status: 'Where most teams are heading' },
  { n: 'Phase 3', h: 'AI-Native Applications',
    p: 'New architectures, new talent profiles, new revenue models. The teams that reach this stage will have built the right foundations first.',
    status: 'The competitive frontier' },
];

export function AIAge() {
  return (
    <section className={styles.ai}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h2>AI doesn&apos;t replace engineering maturity. <strong>It demands it.</strong></h2>
          <p>Why this book is urgent now</p>
        </div>
        <div className={styles.body}>
          <p>
            Every engineering team is under pressure to adopt AI tools, ship AI features, and compete with
            AI-native startups. But here&apos;s what nobody is saying clearly:{' '}
            <strong>AI amplifies whatever your team already is.</strong>
          </p>
          <p>
            A mature, well-structured team becomes dramatically more productive. A fragmented, reactive team
            becomes faster at producing the wrong things. The Pivot Model gives you the foundation to make AI
            work for you — not against you.
          </p>
          <a href="/community" className={styles.cta}>
            Get access now <span className={styles.ar}>→</span>
          </a>
        </div>
        <div className={styles.phases}>
          {PHASES.map(ph => (
            <div key={ph.n} className={styles.phase} data-now={ph.now ?? false}>
              <div className={styles.pn}>{ph.n}</div>
              <h4>{ph.h}</h4>
              <p>{ph.p}</p>
              <div className={styles.status}>{ph.status}</div>
            </div>
          ))}
        </div>
        <div className={styles.truth}>
          <blockquote>
            The engineering teams that will thrive in the age of AI are not the ones with the best tools —{' '}
            <em>they are the ones with the highest maturity.</em>
          </blockquote>
          <cite>— The Pivot Model</cite>
        </div>
      </div>
    </section>
  );
}
