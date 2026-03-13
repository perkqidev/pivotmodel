'use client';

export default function ConsultingSection() {
  return (
    <section className="consulting-section" id="consulting">
      <div className="section-inner">
        <div className="consulting-split">
          <div className="consulting-left reveal">
            <div className="section-label">Direct Access</div>
            <h2 className="section-title">Work directly with<br />the author.</h2>
            <p className="consulting-intro">
              From early-stage offshore setup to L3 strategic partnerships — hands-on advisory
              for engineering leaders at startups to Fortune 500.
            </p>
            <div className="svc-list">
              {[
                { icon: '🔍', name: 'EMB Assessment', desc: 'Deep-dive maturity audit of your offshore engineering team' },
                { icon: '🗺️', name: 'Pivot Roadmap', desc: 'Custom 90-day plan to reach the next maturity level' },
                { icon: '🤖', name: 'AI Readiness Review', desc: 'Evaluate Phase 2 & Phase 3 AI readiness across your team' },
                { icon: '🏗️', name: 'Offshore Team Setup', desc: 'End-to-end guidance on captive vs. third-party models' },
                { icon: '🤝', name: 'General Advisory', desc: 'Ongoing retained access for engineering leaders' },
              ].map(s => (
                <div className="svc-item" key={s.name}>
                  <span className="svc-item-icon">{s.icon}</span>
                  <div>
                    <strong>{s.name}</strong><br />
                    <span>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="consulting-right reveal">
            <div className="consult-card">
              <div className="consult-card-tag">5-minute inquiry · 24-hour response</div>
              <div className="consult-card-title">Tell us about your challenge</div>
              <p className="consult-card-sub">
                Share your situation and what you&apos;re hoping to achieve.
                We&apos;ll come back to you within 24 hours to schedule a conversation.
              </p>
              <div className="consult-highlights">
                <div className="ch-item"><span>25+</span> years offshore engineering experience</div>
                <div className="ch-item"><span>50+</span> teams transformed globally</div>
                <div className="ch-item"><span>L1→L3</span> full maturity spectrum coverage</div>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 16, padding: '14px' }}
                onClick={() => {
                  const modal = document.getElementById('consultModalOverlay');
                  if (modal) modal.style.display = 'flex';
                }}
              >
                🎯 Book a Consulting Session →
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                No commitment required. Just a conversation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
