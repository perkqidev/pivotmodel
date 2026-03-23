'use client';
import { useState, useEffect } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ConsultModal from '@/components/ConsultModal';
import ChatWidget from '@/components/ChatWidget';

interface User { id: number; name: string; email: string; isAdmin: boolean }
interface Assessment { id: number; team_name: string; industry: string; assessment_date: string; updated_at: string; owner_name: string }

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState('home');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { setUser(d.user); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight:'100vh',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ color:'var(--muted)' }}>Loading…</div></div>;
  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <>
      <Nav />
      <div style={{ display:'grid',gridTemplateColumns:'220px 1fr',minHeight:'calc(100vh - 64px)',marginTop:64 }}>
        <Sidebar panel={panel} setPanel={setPanel} user={user} setUser={setUser} />
        <main style={{ background:'var(--ink)',overflowY:'auto' }}>
          <div style={{ padding:32, maxWidth:1200, margin:'0 auto' }}>
            {panel==='home' && <HomePanel user={user} setPanel={setPanel} />}
            {panel==='assessments' && <AssessmentsPanel user={user} />}
            {panel==='materials' && <MaterialsPanel />}
            {panel==='blog' && <BlogPanel />}
            {panel==='whitepapers' && <WhitepapersPanel />}
            {panel==='consulting' && <ConsultingPanel />}
            {panel==='account' && <AccountPanel user={user} setUser={setUser} />}
          </div>
        </main>
      </div>
      <ChatWidget />
    </>
  );
}

function Sidebar({ panel, setPanel, user, setUser }: any) {
  async function logout() { await fetch('/api/auth/login', { method:'DELETE' }); setUser(null); }
  const items = [
    { id:'home', label:'🏠 Home', },
    { id:'assessments', label:'📋 Assessments', },
    { id:'materials', label:'📚 Materials', },
    { id:'blog', label:'✍️ Blog', },
    { id:'whitepapers', label:'📄 Whitepapers', },
    { id:'consulting', label:'💼 Consulting', },
    { id:'account', label:'⚙️ Account', },
  ];
  return (
    <div style={{ background:'var(--surface)',borderRight:'1px solid var(--border)',padding:'24px 0',display:'flex',flexDirection:'column',gap:2 }}>
      <div style={{ padding:'0 20px 20px',borderBottom:'1px solid var(--border)',marginBottom:8 }}>
        <div style={{ fontSize:12,color:'var(--muted)',marginBottom:4 }}>Signed in as</div>
        <div style={{ fontWeight:700,color:'var(--fg)',fontSize:14 }}>{user.name}</div>
        <div style={{ fontSize:12,color:'var(--muted)' }}>{user.email}</div>
        {user.isAdmin && <div style={{ fontSize:11,color:'var(--gold)',marginTop:4,fontWeight:700 }}>ADMIN</div>}
      </div>
      {items.map(item => (
        <button key={item.id} onClick={() => setPanel(item.id)} style={{ textAlign:'left',padding:'10px 20px',background:panel===item.id?'rgba(201,168,76,0.1)':'none',border:'none',borderLeft:panel===item.id?'3px solid var(--gold)':'3px solid transparent',color:panel===item.id?'var(--gold)':'var(--muted)',fontSize:13,cursor:'pointer',fontWeight:panel===item.id?600:400 }}>
          {item.label}
        </button>
      ))}
      {user.isAdmin && (
        <a href="/admin" style={{ textAlign:'left',padding:'10px 20px',background:'none',border:'none',borderLeft:'3px solid transparent',color:'var(--muted)',fontSize:13,cursor:'pointer',textDecoration:'none',display:'block',marginTop:8,borderTop:'1px solid var(--border)',paddingTop:16 }}>
          🔧 Admin Panel
        </a>
      )}
      <button onClick={logout} style={{ textAlign:'left',padding:'10px 20px',background:'none',border:'none',borderLeft:'3px solid transparent',color:'#ef4444',fontSize:13,cursor:'pointer',marginTop:'auto' }}>
        ← Sign out
      </button>
    </div>
  );
}

function HomePanel({ user, setPanel }: any) {
  return (
    <div>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ color:'var(--fg)',marginBottom:8 }}>Welcome back, {user.name.split(' ')[0]} 👋</h1>
        <p style={{ color:'var(--muted)',fontSize:15 }}>The Pivot Model community — assessments, tools, and insights for engineering leaders.</p>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:32 }}>
        {[{ icon:'📋',title:'Assessments',desc:'Evaluate your team across 7 modules',action:()=>setPanel('assessments') },{ icon:'📚',title:'Materials',desc:'Frameworks and tools',action:()=>setPanel('materials') },{ icon:'💼',title:'Consulting',desc:'Work with The Pivot Model team',action:()=>setPanel('consulting') }].map(c=>(
          <button key={c.title} onClick={c.action} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:24,cursor:'pointer',textAlign:'left',transition:'border-color 0.2s' }}>
            <div style={{ fontSize:32,marginBottom:12 }}>{c.icon}</div>
            <div style={{ fontWeight:700,color:'var(--fg)',fontSize:16,marginBottom:4 }}>{c.title}</div>
            <div style={{ color:'var(--muted)',fontSize:13 }}>{c.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssessmentsPanel({ user }: any) {
  const [owned, setOwned] = useState<Assessment[]>([]);
  const [shared, setShared] = useState<Assessment[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ team_name:'', industry:'', assessment_date:new Date().toISOString().slice(0,10) });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetch('/api/assessments').then(r=>r.json()).then(d=>{ setOwned(d.owned||[]); setShared(d.shared||[]); }); }, []);

  async function createAssessment() {
    if (!form.team_name.trim()) return;
    setCreating(true);
    const res = await fetch('/api/assessments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const d = await res.json();
    if (d.id) window.location.href = `/assessment/${d.id}`;
    setCreating(false);
  }

  async function duplicate(assessmentId: number) {
    const res = await fetch('/api/assessments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'duplicate', assessment_id:assessmentId }) });
    const d = await res.json();
    if (d.id) { fetch('/api/assessments').then(r=>r.json()).then(d=>{ setOwned(d.owned||[]); setShared(d.shared||[]); }); }
  }

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
        <h2 style={{ color:'var(--fg)',margin:0 }}>Assessments</h2>
        <button onClick={()=>setShowNew(o=>!o)} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'10px 20px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer' }}>+ New Assessment</button>
      </div>
      {showNew && (
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:24,marginBottom:24 }}>
          <h3 style={{ color:'var(--fg)',marginTop:0,marginBottom:16 }}>New Assessment</h3>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16 }}>
            {[['Team name','team_name','text','e.g. Platform Engineering'],['Industry','industry','text','e.g. FinTech'],['Date','assessment_date','date','']].map(([label,field,type,ph])=>(
              <div key={field as string}>
                <div style={{ fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em' }}>{label as string}</div>
                <input type={type as string} value={(form as any)[field as string]} onChange={e=>setForm(p=>({...p,[field as string]:e.target.value}))} placeholder={ph as string} style={{ width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--fg)',fontSize:14,outline:'none',boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={createAssessment} disabled={creating||!form.team_name.trim()} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'10px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',opacity:creating?0.7:1 }}>{creating?'Creating…':'Create Assessment'}</button>
            <button onClick={()=>setShowNew(false)} style={{ background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'10px 24px',color:'var(--muted)',cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      <AssessmentList title="My Assessments" assessments={owned} onDuplicate={duplicate} />
      {shared.length > 0 && <AssessmentList title="Shared with me" assessments={shared} onDuplicate={duplicate} />}
      {owned.length===0&&shared.length===0&&!showNew && <div style={{ textAlign:'center',padding:64,color:'var(--muted)' }}>No assessments yet. Create your first one above.</div>}
    </div>
  );
}

function AssessmentList({ title, assessments, onDuplicate }: { title:string; assessments:Assessment[]; onDuplicate:(id:number)=>void }) {
  if (!assessments.length) return null;
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ fontWeight:600,color:'var(--muted)',fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:12 }}>{title}</div>
      <div style={{ display:'grid',gap:12 }}>
        {assessments.map(a=>(
          <div key={a.id} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700,color:'var(--fg)',fontSize:16 }}>{a.team_name}</div>
              <div style={{ color:'var(--muted)',fontSize:12,marginTop:2 }}>{a.industry||'—'} · {a.assessment_date?.slice(0,10)||'No date'} · Updated {new Date(a.updated_at).toLocaleDateString()}</div>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>onDuplicate(a.id)} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 14px',color:'var(--muted)',fontSize:12,cursor:'pointer' }}>Duplicate</button>
              <a href={`/assessment/${a.id}`} style={{ background:'var(--gold)',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,fontSize:13,textDecoration:'none',display:'inline-block' }}>Open →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialsPanel() {
  return <div style={{ color:'var(--fg)' }}><h2>Materials</h2><p style={{ color:'var(--muted)' }}>Access frameworks, templates, and reference materials.</p></div>;
}
function BlogPanel() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(()=>{ fetch('/api/blog').then(r=>r.json()).then(d=>setPosts(d.posts||[])); },[]);
  return (
    <div>
      <h2 style={{ color:'var(--fg)',marginBottom:24 }}>Insights</h2>
      <div style={{ display:'grid',gap:16 }}>
        {posts.map(p=>(
          <div key={p.id} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20 }}>
            <div style={{ display:'flex',gap:12,alignItems:'start' }}>
              <div style={{ fontSize:32 }}>{p.emoji}</div>
              <div>
                <div style={{ fontWeight:700,color:'var(--fg)',fontSize:16,marginBottom:4 }}>{p.title}</div>
                <div style={{ color:'var(--muted)',fontSize:13,marginBottom:8 }}>{p.excerpt}</div>
                <div style={{ fontSize:12,color:'var(--muted)' }}>{p.category} · {p.read_time} min read</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function WhitepapersPanel() {
  const [papers, setPapers] = useState<any[]>([]);
  useEffect(()=>{ fetch('/api/whitepapers').then(r=>r.json()).then(d=>setPapers(d.whitepapers||[])).catch(()=>{}); },[]);
  return (
    <div>
      <h2 style={{ color:'var(--fg)',marginBottom:24 }}>Whitepapers</h2>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16 }}>
        {papers.map(p=>(
          <div key={p.id} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20 }}>
            <div style={{ fontSize:28,marginBottom:8 }}>{p.icon}</div>
            <div style={{ fontWeight:700,color:'var(--fg)',marginBottom:4 }}>{p.title}</div>
            <div style={{ color:'var(--muted)',fontSize:13,marginBottom:8 }}>{p.description}</div>
            <div style={{ fontSize:12,color:'var(--muted)' }}>{p.pages} pages · {p.access}</div>
            {p.file_url && <a href={p.file_url} target="_blank" style={{ display:'inline-block',marginTop:12,background:'var(--gold)',borderRadius:8,padding:'6px 14px',color:'var(--gold-btn-text)',fontWeight:700,fontSize:12,textDecoration:'none' }}>Download</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
function ConsultingPanel() {
  return <div style={{ color:'var(--fg)' }}><h2>Consulting</h2><p style={{ color:'var(--muted)' }}>Get expert support for your offshore engineering transformation.</p></div>;
}
function AccountPanel({ user, setUser }: any) {
  async function logout() { await fetch('/api/auth/login', { method:'DELETE' }); setUser(null); }
  return (
    <div>
      <h2 style={{ color:'var(--fg)',marginBottom:24 }}>Account</h2>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:24,maxWidth:400 }}>
        <div style={{ marginBottom:16 }}><div style={{ fontSize:12,color:'var(--muted)',marginBottom:4 }}>Name</div><div style={{ color:'var(--fg)',fontWeight:600 }}>{user.name}</div></div>
        <div style={{ marginBottom:16 }}><div style={{ fontSize:12,color:'var(--muted)',marginBottom:4 }}>Email</div><div style={{ color:'var(--fg)' }}>{user.email}</div></div>
        {user.linkedin && <div style={{ marginBottom:16 }}><div style={{ fontSize:12,color:'var(--muted)',marginBottom:4 }}>LinkedIn</div><a href={user.linkedin} target="_blank" style={{ color:'var(--gold)',fontSize:13 }}>{user.linkedin}</a></div>}
        <button onClick={logout} style={{ background:'none',border:'1px solid #ef4444',borderRadius:8,padding:'10px 20px',color:'#ef4444',cursor:'pointer',fontWeight:600 }}>Sign out</button>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin:(u:any)=>void }) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [step, setStep] = useState<'form'|'otp'>('form');
  const [form, setForm] = useState({ name:'',email:'',company:'',role:'',industry:'',team_size:'',linkedin:'' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(''); setLoading(true);
    const endpoint = mode==='login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode==='login' ? { email:form.email, step:'request' } : { ...form, step:'request' };
    const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) setError(d.error||'Error'); else setStep('otp');
    setLoading(false);
  }

  async function handleOtp() {
    setError(''); setLoading(true);
    const endpoint = mode==='login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode==='login' ? { email:form.email, otp, step:'verify' } : { ...form, otp, step:'verify' };
    const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) setError(d.error||'Error'); else onLogin(d.user);
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ width:'100%',maxWidth:440,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,padding:40 }}>
        <div style={{ textAlign:'center',marginBottom:32 }}>
          <div style={{ fontSize:13,fontWeight:700,letterSpacing:'0.1em',color:'var(--gold)',marginBottom:8 }}>THE PIVOT MODEL</div>
          <h2 style={{ color:'var(--fg)',margin:0 }}>{step==='otp'?'Enter verification code':mode==='login'?'Sign in':'Join the community'}</h2>
        </div>
        {step==='form' && (
          <>
            {mode==='register' && (
              <>
                {[['Full name','name','text'],['Company','company','text'],['Role','role','text'],['Industry','industry','text'],['Team size','team_size','text']].map(([label,field,type])=>(
                  <div key={field} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:12,color:'var(--muted)',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em' }}>{label}</div>
                    <input type={type} value={(form as any)[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))} style={{ width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--fg)',fontSize:14,outline:'none',boxSizing:'border-box' }} />
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12,color:'var(--muted)',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em' }}>LinkedIn URL *</div>
                  <input type="text" value={form.linkedin} onChange={e=>setForm(p=>({...p,linkedin:e.target.value}))} placeholder="https://linkedin.com/in/yourprofile" style={{ width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--fg)',fontSize:14,outline:'none',boxSizing:'border-box' }} />
                  <div style={{ fontSize:11,color:'var(--muted)',marginTop:4 }}>Required. Used instead of corporate email verification.</div>
                </div>
              </>
            )}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,color:'var(--muted)',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em' }}>Email address</div>
              <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={{ width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--fg)',fontSize:14,outline:'none',boxSizing:'border-box' }} />
            </div>
            {error && <div style={{ color:'#ef4444',fontSize:13,marginBottom:12 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ width:'100%',background:'var(--gold)',border:'none',borderRadius:10,padding:'12px',color:'var(--gold-btn-text)',fontWeight:700,fontSize:15,cursor:'pointer',marginBottom:16,opacity:loading?0.7:1 }}>{loading?'Sending…':'Send verification code'}</button>
            <div style={{ textAlign:'center',fontSize:13,color:'var(--muted)' }}>
              {mode==='login' ? <>No account? <button onClick={()=>{setMode('register');setError('');}} style={{ background:'none',border:'none',color:'var(--gold)',cursor:'pointer',fontWeight:600,fontSize:13 }}>Register</button></> : <>Have an account? <button onClick={()=>{setMode('login');setError('');}} style={{ background:'none',border:'none',color:'var(--gold)',cursor:'pointer',fontWeight:600,fontSize:13 }}>Sign in</button></>}
            </div>
          </>
        )}
        {step==='otp' && (
          <>
            <p style={{ color:'var(--muted)',fontSize:14,textAlign:'center',marginBottom:24 }}>Enter the 6-digit code sent to <strong style={{ color:'var(--fg)' }}>{form.email}</strong></p>
            <input value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} placeholder="000000" style={{ width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'14px',color:'var(--fg)',fontSize:24,textAlign:'center',letterSpacing:'0.3em',outline:'none',boxSizing:'border-box',marginBottom:16 }} />
            {error && <div style={{ color:'#ef4444',fontSize:13,marginBottom:12,textAlign:'center' }}>{error}</div>}
            <button onClick={handleOtp} disabled={loading||otp.length!==6} style={{ width:'100%',background:'var(--gold)',border:'none',borderRadius:10,padding:'12px',color:'var(--gold-btn-text)',fontWeight:700,fontSize:15,cursor:'pointer',opacity:loading||otp.length!==6?0.7:1 }}>{loading?'Verifying…':'Verify & Sign in'}</button>
            <button onClick={()=>{setStep('form');setOtp('');setError('');}} style={{ width:'100%',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,marginTop:12 }}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}
