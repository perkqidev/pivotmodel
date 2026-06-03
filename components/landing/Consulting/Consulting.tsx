'use client';

import styles from './Consulting.module.css';

const SERVICES = [
  { n: '01', name: 'EMB Assessment',     desc: 'Deep-dive maturity audit of your offshore engineering team.' },
  { n: '02', name: 'Pivot Roadmap',      desc: 'Custom 90-day plan to reach the next maturity level.' },
  { n: '03', name: 'AI Readiness Review',desc: 'Evaluate Phase 2 & Phase 3 AI readiness across your team.' },
  { n: '04', name: 'Offshore Team Setup',desc: 'End-to-end guidance on captive vs. third-party models.' },
  { n: '05', name: 'General Advisory',   desc: 'Ongoing retained access for engineering leaders.' },
];

const FIGS = [
  { n: '25+',   l: 'Years offshore experience' },
  { n: '50+',   l: 'Teams transformed globally' },
  { n: 'L1→L3', l: 'Full maturity spectrum' },
];

export function Consulting() {
  function openModal() {
    const modal = document.getElementById('consultModalOverlay');
    if (modal) modal.style.display = 'flex';
  }
  return (
    <section id="consulting" className={styles.consulting}>
      <div className={styles.wrap}>
        <div className={styles.grid}>
          <div>
            <div className={styles.label}>05 / 05&nbsp;&nbsp;Direct access</div>
            <h2 className={styles.h}>Work directly with <strong>the author.</strong></h2>
            <p className={styles.lead}>
              From early-stage offshore setup to L3 strategic partnerships — hands-on advisory for
              engineering leaders at startups through Fortune 500.
            </p>
            <div className={styles.svcList}>
              {SERVICES.map(s => (
                <div key={s.n} className={styles.svc}>
                  <span className={styles.svcN}>{s.n}</span>
                  <div>
                    <h5>{s.name}</h5>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cTag}>5-min inquiry · 24-hour response</div>
            <div className={styles.cH}>Tell us about your challenge.</div>
            <div className={styles.cSub}>
              Share your situation and what you’re hoping to achieve. We’ll come back to you within
              24 hours to schedule a conversation.
            </div>
            <div className={styles.figs}>
              {FIGS.map(f => (
                <div key={f.n} className={styles.fig}>
                  <div className={styles.figN}>{f.n}</div>
                  <div className={styles.figL}>{f.l}</div>
                </div>
              ))}
            </div>
            <button type="button" className={styles.cta} onClick={openModal}>
              Book a consulting session →
            </button>
            <div className={styles.note}>No commitment required. Just a conversation.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
