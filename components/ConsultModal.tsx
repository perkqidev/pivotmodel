'use client';
import { useState, useEffect } from 'react';

interface Props { source?: string }

const SVCS = [
  { val: 'EMB Assessment', icon: '🔍', label: 'EMB Assessment' },
  { val: 'Pivot Roadmap (90-day)', icon: '🗺️', label: 'Pivot Roadmap' },
  { val: 'AI Readiness Review', icon: '🤖', label: 'AI Readiness' },
  { val: 'Offshore Team Setup', icon: '🏗️', label: 'Offshore Setup' },
  { val: 'General Advisory / Retained', icon: '🤝', label: 'Advisory' },
  { val: 'Speaking / Workshop', icon: '🎤', label: 'Speaking' },
];

export default function ConsultModal({ source = 'website' }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [svc, setSvc] = useState('');

  const [f, setF] = useState({
    name: '', email: '', company: '', role: '', industry: '', linkedin: '',
    teamSize: '', offshoreModel: '', maturityLevel: '', currentOperation: '',
    challenges: '', expectations: '', preferredContact: '', timezone: '',
    availability: '', timeline: '', howHeard: '', extraNotes: '',
  });

  // Listen for open trigger from ConsultingSection button
  useEffect(() => {
    const el = document.getElementById('consultModalOverlay');
    if (!el) return;
    const obs = new MutationObserver(() => {
      if (el.style.display === 'flex') { setOpen(true); el.style.display = ''; }
    });
    obs.observe(el, { attributes: true, attributeFilter: ['style'] });
    return () => obs.disconnect();
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  function next(s: number) {
    setErr('');
    if (s === 1) {
      if (!f.name || !f.email || !f.company || !f.role) { setErr('Please fill in Name, Email, Company, and Role.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { setErr('Please enter a valid email address.'); return; }
    }
    if (s === 2 && !f.currentOperation) { setErr('Please describe your current offshore operation.'); return; }
    if (s === 3 && (!f.challenges || !f.expectations)) { setErr('Please describe your challenges and expected outcomes.'); return; }
    setStep(s + 1);
  }

  async function submit() {
    setErr('');
    if (!f.name || !f.email || !f.company || !f.role || !f.currentOperation || !f.challenges || !f.expectations) {
      setErr('Please go back and fill in all required fields.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, service: svc, source }),
      });
      if (res.ok) { setDone(true); }
      else { const d = await res.json(); setErr(d.error || 'Submission failed.'); }
    } catch { setErr('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  function close() {
    setOpen(false); setStep(1); setErr(''); setDone(false); setSvc('');
    setF({ name:'',email:'',company:'',role:'',industry:'',linkedin:'',teamSize:'',offshoreModel:'',maturityLevel:'',currentOperation:'',challenges:'',expectations:'',preferredContact:'',timezone:'',availability:'',timeline:'',howHeard:'',extraNotes:'' });
  }

  if (!open) return <div id="consultModalOverlay" style={{ display: 'none' }} />;

  return (
    <>
      <div id="consultModalOverlay" style={{ display: 'none' }} />
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) close(); }}>
        <div className="modal-box" style={{ maxWidth: 680 }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'linear-gradient(135deg,rgba(201,168,76,.08),rgba(122,170,197,.03))' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 5 }}>Direct Access · 25+ Years Experience</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>Book a Consulting Session</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Tell us about your situation — we respond within 24 hours</div>
            </div>
            <button className="modal-close" onClick={close}>×</button>
          </div>

          {/* Steps */}
          <div className="lci-steps">
            {['About You', 'Your Operation', 'Your Goals', 'Logistics'].map((label, i) => (
              <div key={label} className={`lci-step${step === i+1 ? ' active' : step > i+1 ? ' done' : ''}`} onClick={() => step > i+1 && setStep(i+1)}>
                <span className="lci-sn">{i + 1}</span>
                <span className="lci-sl">{label}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '4px 24px 0' }}>
            {err && <div className="alert alert-err" style={{ marginTop: 12 }}>{err}</div>}
            {done && <div className="alert alert-ok" style={{ marginTop: 12 }}>✓ Inquiry received! We&apos;ll be in touch within 24 hours.</div>}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ padding: '20px 24px 8px' }}>
              <div className="field-row">
                <div className="field"><label className="lbl">Full Name <span className="req">*</span></label><input className="inp" value={f.name} onChange={set('name')} placeholder="Your full name" /></div>
                <div className="field"><label className="lbl">Email <span className="req">*</span></label><input className="inp" type="email" value={f.email} onChange={set('email')} placeholder="Your corporate email" /></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="lbl">Company <span className="req">*</span></label><input className="inp" value={f.company} onChange={set('company')} placeholder="Your company" /></div>
                <div className="field"><label className="lbl">Role / Title <span className="req">*</span></label><input className="inp" value={f.role} onChange={set('role')} placeholder="e.g. CTO, VP Engineering" /></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="lbl">Industry</label>
                  <select className="inp" value={f.industry} onChange={set('industry')}>
                    <option value="">Select…</option>
                    {['Software / SaaS','Fintech / Financial Services','Healthtech / Medtech','E-commerce / Marketplace','Enterprise Software','Consulting / Professional Services','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field"><label className="lbl">LinkedIn</label><input className="inp" value={f.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" /></div>
              </div>
              <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => next(1)}>Next: Your Operation →</button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ padding: '20px 24px 8px' }}>
              <div className="field-row">
                <div className="field"><label className="lbl">Team Size</label>
                  <select className="inp" value={f.teamSize} onChange={set('teamSize')}>
                    <option value="">Select…</option>
                    {['1–10 engineers','11–50 engineers','51–200 engineers','200+ engineers'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field"><label className="lbl">Offshore Setup</label>
                  <select className="inp" value={f.offshoreModel} onChange={set('offshoreModel')}>
                    <option value="">Select…</option>
                    {['Captive / In-house offshore','Third-party vendor / outsourced','Hybrid','No offshore team yet','Exploring options'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label className="lbl">Describe your current offshore operation <span className="req">*</span></label>
                <textarea className="inp" value={f.currentOperation} onChange={set('currentOperation')} rows={4} placeholder="Where is your team? How long running? How is it structured?" style={{ resize: 'vertical' }} />
              </div>
              <div className="field"><label className="lbl">Maturity level (self-assessed)</label>
                <select className="inp" value={f.maturityLevel} onChange={set('maturityLevel')}>
                  <option value="">Not sure / Not applicable</option>
                  {['L1 — Execution Focus','L2 — Engineering Ownership','L3 — Strategic Partnership','Somewhere between L1 and L2','Somewhere between L2 and L3'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => next(2)}>Next: Your Goals →</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ padding: '20px 24px 8px' }}>
              <div className="field"><label className="lbl">Service of interest</label>
                <div className="lci-svc-grid">
                  {SVCS.map(s => (
                    <div key={s.val} className={`lci-svc${svc === s.val ? ' sel' : ''}`} onClick={() => setSvc(s.val)}>
                      <div className="lci-svc-icon">{s.icon}</div>
                      <div>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="field"><label className="lbl">Key challenges <span className="req">*</span></label>
                <textarea className="inp" value={f.challenges} onChange={set('challenges')} rows={3} placeholder="What problems are you running into?" style={{ resize: 'vertical' }} />
              </div>
              <div className="field"><label className="lbl">Outcomes you&apos;re hoping to achieve <span className="req">*</span></label>
                <textarea className="inp" value={f.expectations} onChange={set('expectations')} rows={3} placeholder="What does success look like 6–12 months from now?" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" onClick={() => next(3)}>Next: Logistics →</button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && !done && (
            <div style={{ padding: '20px 24px 8px' }}>
              <div className="field-row">
                <div className="field"><label className="lbl">Preferred contact</label>
                  <select className="inp" value={f.preferredContact} onChange={set('preferredContact')}>
                    <option value="">No preference</option>
                    {['Video call','Email first, then call','WhatsApp / Messaging','Phone call'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field"><label className="lbl">Your time zone</label>
                  <select className="inp" value={f.timezone} onChange={set('timezone')}>
                    <option value="">Select…</option>
                    {['UTC−8 to UTC−5 (US)','UTC+0 to UTC+2 (Europe)','UTC+5:30 (India IST)','UTC+3 to UTC+5 (Middle East)','UTC+7 to UTC+9 (Southeast Asia)','UTC+10 to UTC+12 (Australia)'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label className="lbl">Best times to reach you</label>
                <input className="inp" value={f.availability} onChange={set('availability')} placeholder="e.g. Weekday mornings IST, Tuesdays after 2pm GMT" />
              </div>
              <div className="field-row">
                <div className="field"><label className="lbl">How soon do you need to start?</label>
                  <select className="inp" value={f.timeline} onChange={set('timeline')}>
                    <option value="">No preference</option>
                    {['Urgent — this week','Within 2 weeks','Within a month','Within the quarter','Just exploring'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field"><label className="lbl">How did you hear about us?</label>
                  <select className="inp" value={f.howHeard} onChange={set('howHeard')}>
                    <option value="">Select…</option>
                    {['The Pivot Model book','LinkedIn','Colleague / referral','Conference / event','Google search','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label className="lbl">Anything else we should know</label>
                <textarea className="inp" value={f.extraNotes} onChange={set('extraNotes')} rows={3} placeholder="Budget range, specific constraints, previous consulting experience…" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ padding: '14px 0', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
                <button className="btn btn-primary" onClick={submit} disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit Inquiry →'}
                </button>
              </div>
            </div>
          )}

          {done && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>Inquiry received!</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>We&apos;ll be in touch within 24 hours to schedule your conversation.</div>
              <button className="btn btn-outline" onClick={close}>Close</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
