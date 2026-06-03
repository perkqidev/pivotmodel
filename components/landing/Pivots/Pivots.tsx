import styles from './Pivots.module.css';

interface Props { theme: 'light' | 'dark'; }

const PIVOTS = [
  { num: '01', tag: 'Foundation', title: 'Operational Excellence',
    desc: 'Predictable delivery, quality ownership and engineering discipline — the non-negotiable foundation of any high-performance team.' },
  { num: '02', tag: 'Velocity', title: 'Pace of Product Evolution',
    desc: 'Speed matters. Build the capabilities that accelerate time-to-market without sacrificing quality or accruing debt.' },
  { num: '03', tag: 'Alignment', title: 'Collaboration & Alignment',
    desc: 'Bridging the distance — cultural, temporal and organisational — between offshore teams and the business they serve.' },
  { num: '04', tag: 'Impact', title: 'Business Results',
    desc: 'Engineering exists to drive outcomes, not output. Connect engineering KRAs directly to top-line business impact.' },
];

export function Pivots({ theme }: Props) {
  const suf = theme === 'dark' ? '-dark' : '';
  return (
    <section id="framework" className={styles.pivots}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h2>Four pivots. <strong>One transformation.</strong></h2>
          <p className={styles.lead}>
            The Pivot Model organises offshore engineering maturity around four interconnected performance
            dimensions. Master them in sequence — or diagnose exactly where your team is struggling today.
          </p>
        </div>
        {PIVOTS.map((p, i) => (
          <div key={p.num} className={styles.row}>
            <div className={styles.num}>{p.num}</div>
            <div className={styles.title}>
              <h3>{p.title}</h3>
              <div className={styles.tag}>{p.tag}</div>
            </div>
            <p className={styles.desc}>{p.desc}</p>
            <div className={styles.thumb}>
              <img src={`/img/aero-pv${i + 1}${suf}.svg`} alt="" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
