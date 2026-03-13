// components/StatsBand.tsx
export function StatsBand() {
  return (
    <section className="stats-band">
      <div className="stats-inner">
        {[
          { num: '25+', label: 'Years of offshore engineering experience distilled' },
          { num: '4', label: 'Core pivot pillars for operational excellence' },
          { num: '3', label: 'Maturity levels with clear, measurable benchmarks' },
          { num: '∞', label: 'Potential unlocked when offshore teams truly thrive' },
        ].map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {i > 0 && <div className="stat-divider" />}
            <div className="stat reveal" style={{ flex: 1 }}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsBand;
