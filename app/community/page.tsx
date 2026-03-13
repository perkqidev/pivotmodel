'use client';
import { useState, useEffect, useCallback } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ConsultModal from '@/components/ConsultModal';
import EMBSpreadsheet from '@/components/EMBSpreadsheet';

interface User { id: number; name: string; email: string; isAdmin: boolean }
interface BlogPost { id: number; title: string; category: string; excerpt: string; emoji: string; read_time: number; published_at: string; status: string }
interface Whitepaper { id: number; title: string; category: string; description: string; icon: string; pages: number; access: string }

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState('home');

  useEffect(() => {
    fetch('/api/auth/login').then(r => r.json()).then(d => {
      setUser(d.user);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--muted)' }}>Loading…</div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <>
      <Nav />
      <div className="comm-layout">
        <Sidebar panel={panel} setPanel={setPanel} user={user} setUser={setUser} />
        <main className="comm-main">
          {panel === 'home' && <HomePanel user={user} setPanel={setPanel} />}
          {panel === 'emb' && <EMBPanel user={user} />}
          {panel === 'materials' && <MaterialsPanel />}
          {panel === 'blog' && <BlogPanel />}
          {panel === 'whitepapers' && <WhitepapersPanel />}
          {panel === 'consulting' && <ConsultingPanel />}
          {panel === 'account' && <AccountPanel user={user} setUser={setUser} />}
        </main>
      </div>
      <ConsultModal source="community" />
    </>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ panel, setPanel, user, setUser }: { panel: string; setPanel: (p: string) => void; user: User; setUser: (u: User | null) => void }) {
  async function logout() {
    await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    setUser(null);
  }
  const item = (id: string, icon: string, label: string) => (
    <button key={id} className={`s-item${panel === id ? ' active' : ''}`} onClick={() => setPanel(id)}>
      <span className="s-icon">{icon}</span> {label}
    </button>
  );
  return (
    <aside className="sidebar">
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ink-3)', border: '1px solid var(--gold-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Member</div>
          </div>
        </div>
      </div>
      <div className="s-label">Community</div>
      {item('home', '🏠', 'Home')}
      {item('blog', '📝', 'Blog')}
      {item('whitepapers', '📄', 'Whitepapers')}
      <div className="s-label">Tools</div>
      {item('emb', '📊', 'EMB Assessment')}
      {item('materials', '📋', 'Materials')}
      <div className="s-label">Consulting</div>
      {item('consulting', '🎯', 'Book a Session')}
      <div className="s-label">Account</div>
      {item('account', '👤', 'My Profile')}
      {user.isAdmin && item('admin', '⚙️', 'Admin Panel')}
      <button className="s-item" onClick={logout} style={{ marginTop: 8 }}>
        <span className="s-icon">🚪</span> Sign Out
      </button>
    </aside>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--ink)' }}>
        <div className="auth-wrap">
          <div className="auth-left">
            <div className="auth-hl">The community for<br /><em>engineering leaders</em><br />who build offshore excellence.</div>
            <div className="auth-perks">
              {['Access all EMB frameworks and templates', 'Book consulting sessions with the author', 'Download whitepapers and playbooks', 'Track your team\'s maturity with the EMB spreadsheet'].map(p => (
                <div className="perk" key={p}>
                  <div className="perk-dot">◆</div>
                  <span>{p}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: 13, background: 'rgba(232,139,126,.07)', border: '1px solid rgba(232,139,126,.2)', borderRadius: 6, fontSize: 12, color: 'var(--muted)', maxWidth: 400 }}>
              This community is for engineering professionals. Corporate email addresses required.
            </div>
          </div>
          <div className="auth-right">
            <div className="auth-card">
              <div className="auth-tabs">
                <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Join Free</button>
                <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
              </div>
              <div className="auth-body">
                {tab === 'register' ? <RegisterForm onLogin={onLogin} /> : <LoginForm onLogin={onLogin} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────
function RegisterForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [f, setF] = useState({ name: '', email: '', company: '', role: '', industry: '', teamSize: '', linkedin: '' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  async function sendOtp() {
    setErr(''); setLoading(true);
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_otp', ...f }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(d.error); return; }
    if (d.dev_otp) setDevOtp(d.dev_otp);
    setStep('otp');
    setOk('Verification code sent to ' + f.email);
  }

  async function verify() {
    setErr(''); setLoading(true);
    const code = otp.join('');
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_otp', ...f, otp: code }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(d.error); return; }
    // Auto-login after registration
    const lr = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_otp', email: f.email }) });
    const ld = await lr.json();
    if (ld.dev_otp) {
      const vr = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_otp', email: f.email, otp: ld.dev_otp }) });
      const vd = await vr.json();
      if (vd.user) { onLogin(vd.user); return; }
    }
    setOk('Account created! Please log in.');
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value;
    if (/^\d$/.test(val)) {
      const next = [...otp]; next[i] = val; setOtp(next);
      if (i < 5) (document.querySelectorAll('.otp-digit')[i + 1] as HTMLInputElement)?.focus();
    } else if (e.key === 'Backspace') {
      const next = [...otp]; next[i] = ''; setOtp(next);
      if (i > 0) (document.querySelectorAll('.otp-digit')[i - 1] as HTMLInputElement)?.focus();
    }
    e.preventDefault();
  };

  if (step === 'otp') return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>Check your email</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
        We sent a 6-digit code to <strong>{f.email}</strong>
      </div>
      {devOtp && <div style={{ padding: 10, background: 'rgba(126,232,162,.07)', border: '1px dashed rgba(126,232,162,.3)', borderRadius: 6, fontSize: 12, color: 'var(--green)', textAlign: 'left', marginBottom: 16 }}><strong style={{ display: 'block', marginBottom: 3, opacity: .7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Dev mode — OTP:</strong>{devOtp}</div>}
      <div className="otp-inputs">
        {otp.map((v, i) => (
          <input key={i} className="otp-digit" maxLength={1} value={v} onKeyDown={e => handleOtpKey(i, e)} readOnly onChange={() => {}} />
        ))}
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={verify} disabled={loading || otp.join('').length < 6}>
        {loading ? 'Verifying…' : 'Verify & Create Account'}
      </button>
      <div style={{ marginTop: 12 }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer' }} onClick={() => setStep('details')}>← Back</button>
      </div>
    </div>
  );

  return (
    <>
      {err && <div className="alert alert-err">{err}</div>}
      <div className="field-row">
        <div className="field"><label className="lbl">Full Name <span className="req">*</span></label><input className="inp" value={f.name} onChange={set('name')} placeholder="Your full name" /></div>
        <div className="field"><label className="lbl">Email <span className="req">*</span></label><input className="inp" type="email" value={f.email} onChange={set('email')} placeholder="Corporate email" /></div>
      </div>
      <div className="field-row">
        <div className="field"><label className="lbl">Company <span className="req">*</span></label><input className="inp" value={f.company} onChange={set('company')} placeholder="Your company" /></div>
        <div className="field"><label className="lbl">Role <span className="req">*</span></label><input className="inp" value={f.role} onChange={set('role')} placeholder="e.g. CTO, VP Engineering" /></div>
      </div>
      <div className="field-row">
        <div className="field"><label className="lbl">Industry</label>
          <select className="inp" value={f.industry} onChange={set('industry')}>
            <option value="">Select…</option>
            {['Software / SaaS','Fintech','Healthtech','E-commerce','Enterprise Software','Consulting','Other'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="field"><label className="lbl">Team Size</label>
          <select className="inp" value={f.teamSize} onChange={set('teamSize')}>
            <option value="">Select…</option>
            {['1–10','11–50','51–200','200+'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label className="lbl">LinkedIn (optional)</label><input className="inp" value={f.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" /></div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={sendOtp} disabled={loading}>
        {loading ? 'Sending code…' : 'Send Verification Code →'}
      </button>
    </>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  async function sendOtp() {
    setErr(''); setLoading(true);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_otp', email }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(d.error); return; }
    if (d.dev_otp) setDevOtp(d.dev_otp);
    setStep('otp');
  }

  async function verify() {
    setErr(''); setLoading(true);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_otp', email, otp: otp.join('') }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(d.error); return; }
    onLogin(d.user);
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value;
    if (/^\d$/.test(val)) {
      const next = [...otp]; next[i] = val; setOtp(next);
      if (i < 5) (document.querySelectorAll('.otp-digit')[i + 1] as HTMLInputElement)?.focus();
    } else if (e.key === 'Backspace') {
      const next = [...otp]; next[i] = ''; setOtp(next);
      if (i > 0) (document.querySelectorAll('.otp-digit')[i - 1] as HTMLInputElement)?.focus();
    }
    e.preventDefault();
  };

  if (step === 'otp') return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>Check your inbox</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Enter the 6-digit code sent to <strong>{email}</strong></div>
      {devOtp && <div style={{ padding: 10, background: 'rgba(126,232,162,.07)', border: '1px dashed rgba(126,232,162,.3)', borderRadius: 6, fontSize: 12, color: 'var(--green)', marginBottom: 16 }}><strong style={{ display: 'block', marginBottom: 3, opacity: .7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Dev mode — OTP:</strong>{devOtp}</div>}
      <div className="otp-inputs">
        {otp.map((v, i) => (
          <input key={i} className="otp-digit" maxLength={1} value={v} onKeyDown={e => handleOtpKey(i, e)} readOnly onChange={() => {}} />
        ))}
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={verify} disabled={loading || otp.join('').length < 6}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <div style={{ marginTop: 12 }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer' }} onClick={() => setStep('email')}>← Use different email</button>
      </div>
    </div>
  );

  return (
    <>
      {err && <div className="alert alert-err">{err}</div>}
      <div className="field"><label className="lbl">Email Address</label>
        <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your registered email" onKeyDown={e => e.key === 'Enter' && sendOtp()} />
        <div className="hint">We&apos;ll send a one-time code to this address</div>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={sendOtp} disabled={loading || !email}>
        {loading ? 'Sending code…' : 'Send Sign-In Code →'}
      </button>
    </>
  );
}

// ── Home Panel ────────────────────────────────────────────────────────────
function HomePanel({ user, setPanel }: { user: User; setPanel: (p: string) => void }) {
  return (
    <div>
      <div className="p-title">Welcome back, {user.name.split(' ')[0]}.</div>
      <div className="p-sub">Here&apos;s your community hub.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { icon: '📊', title: 'EMB Assessment', desc: 'Assess your team\'s maturity across the four pivots', panel: 'emb' },
          { icon: '📝', title: 'Blog', desc: 'Latest thinking from the author', panel: 'blog' },
          { icon: '📄', title: 'Whitepapers', desc: 'Frameworks and research to download', panel: 'whitepapers' },
          { icon: '📋', title: 'Materials', desc: 'Templates, playbooks, and guides', panel: 'materials' },
          { icon: '🎯', title: 'Book Consulting', desc: 'Work directly with the author', panel: 'consulting' },
          { icon: '👤', title: 'My Profile', desc: 'Manage your account details', panel: 'account' },
        ].map(c => (
          <div key={c.panel} className="card" style={{ cursor: 'pointer', transition: 'border-color .2s' }}
            onClick={() => setPanel(c.panel)}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-d)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EMB Panel ─────────────────────────────────────────────────────────────
function EMBPanel({ user }: { user: User }) {
  return (
    <div>
      <div className="p-title">📊 EMB Assessment</div>
      <div className="p-sub">Engineering Maturity Benchmark — assess your offshore team across all four pivots</div>
      <EMBSpreadsheet userId={user.id} />
    </div>
  );
}

// ── Materials Panel ───────────────────────────────────────────────────────
function MaterialsPanel() {
  const items = [
    { icon: '📋', title: 'EMB Schema Templates', desc: 'Custom Engineering Maturity Benchmark worksheets — ready to adapt for your organisation.' },
    { icon: '📊', title: 'KRA & Performance Frameworks', desc: 'Role-by-role Key Result Areas aligned to the Four Pivots, with scoring rubrics.' },
    { icon: '🗺️', title: 'Offshore Setup Playbooks', desc: 'Captive unit vs third-party decision trees, engagement format guides, and onboarding frameworks.' },
    { icon: '🧪', title: 'Self-Assessment Tools', desc: 'Quick-score your team\'s maturity across all Four Pivots in under 20 minutes.' },
    { icon: '🎯', title: 'AI Impact Guides', desc: 'Practical guides to navigating the three phases of AI\'s impact on engineering talent.' },
  ];
  return (
    <div>
      <div className="p-title">📋 Materials</div>
      <div className="p-sub">Frameworks, templates, and playbooks for engineering leaders</div>
      <div className="materials-grid">
        {items.map(m => (
          <div className="material-item" key={m.title} style={{ cursor: 'pointer' }}>
            <div className="material-icon">{m.icon}</div>
            <h4>{m.title}</h4>
            <p>{m.desc}</p>
            <div className="material-lock" style={{ color: 'var(--gold)' }}>📬 Contact us to access</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Blog Panel ────────────────────────────────────────────────────────────
function BlogPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => {
    fetch('/api/blog').then(r => r.json()).then(d => setPosts(d.posts || []));
  }, []);
  const timeAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (d < 86400) return 'today';
    if (d < 30 * 86400) return `${Math.floor(d / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
  return (
    <div>
      <div className="p-title">📝 Blog</div>
      <div className="p-sub">Latest thinking from the author</div>
      {posts.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>No posts yet.</div>}
      {posts.map(p => (
        <div className="card" key={p.id}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>{p.category}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>{p.excerpt}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{timeAgo(p.published_at)} · {p.read_time} min read</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Whitepapers Panel ─────────────────────────────────────────────────────
function WhitepapersPanel() {
  const [papers, setPapers] = useState<Whitepaper[]>([]);
  useEffect(() => {
    fetch('/api/whitepapers').then(r => r.json()).then(d => setPapers(d.whitepapers || []));
  }, []);
  return (
    <div>
      <div className="p-title">📄 Whitepapers</div>
      <div className="p-sub">Research and frameworks to download</div>
      {papers.map(p => (
        <div className="card" key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: 3 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{p.category} · {p.pages} pages</div>
            {p.description && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{p.description}</div>}
          </div>
          <div>
            <span className={`badge ${p.access === 'public' ? 'b-green' : 'b-gold'}`}>{p.access === 'public' ? 'Free' : 'Members'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Consulting Panel ──────────────────────────────────────────────────────
function ConsultingPanel() {
  return (
    <div>
      <div className="p-title">🎯 Book a Consulting Session</div>
      <div className="p-sub">Work directly with the author on your offshore engineering challenges</div>
      <div style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.06),rgba(122,170,197,.04))', border: '1px solid var(--gold-d)', borderRadius: 8, padding: 28, marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--cream)', marginBottom: 12 }}>25+ years. 50+ teams transformed.</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          From early-stage offshore setup to L3 strategic partnerships — hands-on advisory for engineering leaders at startups to Fortune 500.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
        {[
          { icon: '🔍', name: 'EMB Assessment', desc: 'Deep-dive maturity audit of your offshore engineering team' },
          { icon: '🗺️', name: 'Pivot Roadmap', desc: 'Custom 90-day plan to reach the next maturity level' },
          { icon: '🤖', name: 'AI Readiness Review', desc: 'Evaluate Phase 2 & Phase 3 AI readiness across your team' },
          { icon: '🏗️', name: 'Offshore Team Setup', desc: 'End-to-end guidance on captive vs. third-party models' },
        ].map(s => (
          <div key={s.name} style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 20, marginBottom: 7 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: 4, fontSize: 13 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-large" style={{ width: '100%' }}
        onClick={() => { const el = document.getElementById('consultModalOverlay'); if (el) el.style.display = 'flex'; }}>
        🎯 Submit a Consulting Inquiry →
      </button>
    </div>
  );
}

// ── Account Panel ─────────────────────────────────────────────────────────
function AccountPanel({ user, setUser }: { user: User; setUser: (u: User | null) => void }) {
  const [f, setF] = useState({ name: user.name, company: '', role: '', industry: '', teamSize: '', linkedin: '', bio: '' });
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/members?me=1').then(r => r.json()).then(d => {
      if (d.user) setF({ name: d.user.name || '', company: d.user.company || '', role: d.user.role || '', industry: d.user.industry || '', teamSize: d.user.team_size || '', linkedin: d.user.linkedin || '', bio: d.user.bio || '' });
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  async function save() {
    setErr(''); setOk('');
    const res = await fetch('/api/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_profile', ...f }) });
    if (res.ok) setOk('Profile updated successfully.');
    else { const d = await res.json(); setErr(d.error || 'Update failed.'); }
  }

  return (
    <div>
      <div className="p-title">👤 My Profile</div>
      <div className="p-sub">Update your account details</div>
      {ok && <div className="alert alert-ok">{ok}</div>}
      {err && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <div style={{ marginBottom: 16, padding: '0 0 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Email address (cannot be changed)</div>
          <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{user.email}</div>
        </div>
        <div className="field-row">
          <div className="field"><label className="lbl">Full Name</label><input className="inp" value={f.name} onChange={set('name')} /></div>
          <div className="field"><label className="lbl">Company</label><input className="inp" value={f.company} onChange={set('company')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label className="lbl">Role / Title</label><input className="inp" value={f.role} onChange={set('role')} /></div>
          <div className="field"><label className="lbl">Industry</label>
            <select className="inp" value={f.industry} onChange={set('industry')}>
              <option value="">Select…</option>
              {['Software / SaaS','Fintech','Healthtech','E-commerce','Enterprise Software','Consulting','Other'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field"><label className="lbl">Team Size</label>
            <select className="inp" value={f.teamSize} onChange={set('teamSize')}>
              <option value="">Select…</option>
              {['1–10','11–50','51–200','200+'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field"><label className="lbl">LinkedIn</label><input className="inp" value={f.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" /></div>
        </div>
        <div className="field"><label className="lbl">Bio (optional)</label>
          <textarea className="inp" value={f.bio} onChange={set('bio')} rows={3} style={{ resize: 'vertical' }} placeholder="A sentence about you and your engineering background" />
        </div>
        <button className="btn btn-primary" onClick={save}>Save Changes</button>
      </div>
    </div>
  );
}
