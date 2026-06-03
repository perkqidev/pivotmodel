'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast/ToastProvider';

type Tab = 'users'|'blog'|'whitepapers'|'chat'|'stats';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>('users');

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => {
      if (d.user?.isAdmin) setAuthed(true);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  if (checking) return <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>Checking access…</div>;
  if (!authed) return <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--red)',fontSize:18}}>Access denied. Admin only.</div>;

  const TABS: {id:Tab;label:string}[] = [{id:'users',label:'👥 Users'},{id:'blog',label:'✍️ Blog'},{id:'whitepapers',label:'📄 Whitepapers'},{id:'chat',label:'💬 Chat Config'},{id:'stats',label:'📊 Stats'}];

  return (
    <div style={{minHeight:'100vh',background:'var(--ink)',color:'var(--cream)'}}>
      <div style={{background:'var(--ink-2)',borderBottom:'1px solid var(--border-2)',padding:'0 32px',display:'flex',alignItems:'center',gap:32}}>
        <div style={{padding:'16px 0',fontWeight:700,fontSize:16,color:'var(--gold)',letterSpacing:'0.05em'}}>PIVOT MODEL · ADMIN</div>
        <div style={{display:'flex',gap:4,flex:1}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'16px 20px',background:'none',border:'none',borderBottom:`3px solid ${tab===t.id?'var(--gold)':'transparent'}`,color:tab===t.id?'var(--gold)':'var(--muted)',fontSize:13,fontWeight:tab===t.id?700:400,cursor:'pointer'}}>{t.label}</button>)}
        </div>
        <a href="/community" style={{fontSize:13,color:'var(--muted)',textDecoration:'none'}}>← Back to portal</a>
      </div>
      <div style={{padding:32,maxWidth:1400,margin:'0 auto'}}>
        {tab==='users' && <UsersTab />}
        {tab==='blog' && <BlogTab />}
        {tab==='whitepapers' && <WhitepapersTab />}
        {tab==='chat' && <ChatConfigTab />}
        {tab==='stats' && <StatsTab />}
      </div>
    </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(()=>{fetch('/api/admin/users').then(r=>r.json()).then(d=>setUsers(d.users||[]));}, []);
  async function action(userId:number, act:string) {
    try {
      const res = await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:act,userId})});
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || `Could not ${act} user.`);
        return;
      }
      const labels: Record<string,string> = { activate:'activated', deactivate:'deactivated', promote:'promoted to admin', demote:'demoted' };
      toast.success(`User ${labels[act] || 'updated'}.`);
      fetch('/api/admin/users').then(r=>r.json()).then(d=>setUsers(d.users||[]));
    } catch {
      toast.error('Network error. Please try again.');
    }
  }
  const filtered = users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase())||u.company?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0,color:'var(--cream)'}}>Users ({users.length})</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:8,padding:'8px 14px',color:'var(--cream)',fontSize:13,outline:'none',width:240}} />
      </div>
      <div style={{background:'var(--ink-2)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border-2)'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1.5fr 1fr 80px 100px 100px 200px',padding:'10px 16px',background:'var(--ink)',fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          <div>Name</div><div>Email</div><div>Company</div><div>Assessments</div><div>Status</div><div>Admin</div><div>Chat (30d)</div><div>Actions</div>
        </div>
        {filtered.map((u,i)=>(
          <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 2fr 1.5fr 1fr 80px 100px 100px 200px',padding:'12px 16px',borderTop:'1px solid var(--border-2)',background:i%2===0?'transparent':'rgba(255,255,255,0.01)',alignItems:'center'}}>
            <div style={{color:'var(--cream)',fontSize:13,fontWeight:500}}>{u.name}</div>
            <div style={{color:'var(--muted)',fontSize:12}}>{u.email}</div>
            <div style={{color:'var(--muted)',fontSize:12}}>{u.company||'—'}</div>
            <div style={{color:'var(--muted)',fontSize:13}}>{u.assessment_count||0}</div>
            <div style={{color:u.status==='active'?'var(--green)':'var(--red)',fontSize:12,fontWeight:600}}>{u.status}</div>
            <div style={{color:u.is_admin?'var(--gold)':'var(--muted)',fontSize:12,fontWeight:600}}>{u.is_admin?'Admin':'Member'}</div>
            <div style={{color:'var(--muted)',fontSize:12}}>{u.chat_month||0} msgs</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {u.status==='active' ? <button onClick={()=>action(u.id,'deactivate')} style={btnSm('var(--red)')}>Deactivate</button> : <button onClick={()=>action(u.id,'activate')} style={btnSm('var(--green)')}>Activate</button>}
              {u.is_admin ? <button onClick={()=>action(u.id,'demote')} style={btnSm('var(--muted)')}>Demote</button> : <button onClick={()=>action(u.id,'promote')} style={btnSm('var(--gold)')}>Make Admin</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogTab() {
  const toast = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any|null>(null);
  useEffect(()=>{fetch('/api/blog?all=1').then(r=>r.json()).then(d=>setPosts(d.posts||[]));}, []);
  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    try {
      const res = await fetch('/api/blog',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(editing)});
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        toast.error(d.error || 'Could not save post.');
        return;
      }
      toast.success(editing.id ? 'Post updated.' : 'Post created.');
      fetch('/api/blog?all=1').then(r=>r.json()).then(d=>setPosts(d.posts||[]));
      setEditing(null);
    } catch {
      toast.error('Network error. Save failed.');
    }
  }
  async function del(id:number) {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch('/api/blog',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
      if (!res.ok) { toast.error('Delete failed.'); return; }
      setPosts(prev=>prev.filter(p=>p.id!==id));
      toast.success('Post deleted.');
    } catch {
      toast.error('Network error. Delete failed.');
    }
  }
  if (editing) return (
    <div>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:24}}>
        <button onClick={()=>setEditing(null)} style={{background:'none',border:'1px solid var(--border-2)',borderRadius:8,padding:'8px 14px',color:'var(--muted)',cursor:'pointer',fontSize:13}}>← Cancel</button>
        <h2 style={{margin:0,color:'var(--cream)'}}>{editing.id?'Edit Post':'New Post'}</h2>
      </div>
      <div style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:16,padding:24,display:'grid',gap:16}}>
        {[['Title','title','input',''],['Category','category','input',''],['Excerpt','excerpt','textarea',''],['Body','body','textarea',''],['Emoji','emoji','input',''],['Read time (min)','read_time','input','']].map(([label,field,type,ph])=>(
          <div key={field as string}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label as string}</div>
            {type==='textarea' ? <textarea value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} rows={6} style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}} /> : <input value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,outline:'none',boxSizing:'border-box'}} />}
          </div>
        ))}
        <div>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</div>
          <select value={editing.status||'draft'} onChange={e=>setEditing((p:any)=>({...p,status:e.target.value}))} style={{background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,cursor:'pointer',outline:'none'}}>
            <option value="draft">Draft</option><option value="published">Published</option>
          </select>
        </div>
        <button onClick={save} style={{background:'var(--cream)',border:'none',borderRadius:8,padding:'12px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:14}}>Save Post</button>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0,color:'var(--cream)'}}>Blog Posts ({posts.length})</h2>
        <button onClick={()=>setEditing({title:'',category:'',excerpt:'',body:'',emoji:'📝',read_time:4,status:'draft'})} style={{background:'var(--cream)',border:'none',borderRadius:8,padding:'10px 20px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer'}}>+ New Post</button>
      </div>
      <div style={{display:'grid',gap:12}}>
        {posts.map(p=>(
          <div key={p.id} style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:28}}>{p.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:'var(--cream)'}}>{p.title}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{p.category} · {p.status} · {p.read_time}min</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditing(p)} style={{background:'none',border:'1px solid var(--border-2)',borderRadius:8,padding:'6px 14px',color:'var(--muted)',cursor:'pointer',fontSize:12}}>Edit</button>
              <button onClick={()=>del(p.id)} style={{background:'none',border:'1px solid var(--red)',borderRadius:8,padding:'6px 14px',color:'var(--red)',cursor:'pointer',fontSize:12}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhitepapersTab() {
  const toast = useToast();
  const [papers, setPapers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any|null>(null);
  useEffect(()=>{fetch('/api/whitepapers?all=1').then(r=>r.json()).then(d=>setPapers(d.whitepapers||[])).catch(()=>{});}, []);
  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    try {
      const res = await fetch('/api/whitepapers',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(editing)});
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        toast.error(d.error || 'Could not save whitepaper.');
        return;
      }
      toast.success(editing.id ? 'Whitepaper updated.' : 'Whitepaper added.');
      fetch('/api/whitepapers?all=1').then(r=>r.json()).then(d=>setPapers(d.whitepapers||[])).catch(()=>{});
      setEditing(null);
    } catch {
      toast.error('Network error. Save failed.');
    }
  }
  async function delPaper(pid:number) {
    try {
      const res = await fetch('/api/whitepapers',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:pid})});
      if (!res.ok) { toast.error('Delete failed.'); return; }
      setPapers(prev=>prev.filter(x=>x.id!==pid));
      toast.success('Whitepaper deleted.');
    } catch {
      toast.error('Network error. Delete failed.');
    }
  }
  if (editing) return (
    <div>
      <button onClick={()=>setEditing(null)} style={{background:'none',border:'1px solid var(--border-2)',borderRadius:8,padding:'8px 14px',color:'var(--muted)',cursor:'pointer',fontSize:13,marginBottom:20}}>← Cancel</button>
      <div style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:16,padding:24,display:'grid',gap:16}}>
        {[['Title','title','input'],['Category','category','input'],['Description','description','textarea'],['Icon (emoji)','icon','input'],['Pages','pages','input'],['File URL','file_url','input']].map(([label,field,type])=>(
          <div key={field as string}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label as string}</div>
            {type==='textarea' ? <textarea value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} rows={3} style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}} /> : <input value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,outline:'none',boxSizing:'border-box'}} />}
          </div>
        ))}
        <div>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Access</div>
          <select value={editing.access||'members'} onChange={e=>setEditing((p:any)=>({...p,access:e.target.value}))} style={{background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,cursor:'pointer',outline:'none'}}>
            <option value="public">Public</option><option value="members">Members only</option>
          </select>
        </div>
        <button onClick={save} style={{background:'var(--cream)',border:'none',borderRadius:8,padding:'12px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:14}}>Save</button>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0,color:'var(--cream)'}}>Whitepapers</h2>
        <button onClick={()=>setEditing({title:'',category:'',description:'',icon:'📄',pages:1,access:'members',file_url:''})} style={{background:'var(--cream)',border:'none',borderRadius:8,padding:'10px 20px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer'}}>+ Add Whitepaper</button>
      </div>
      <div style={{display:'grid',gap:12}}>
        {papers.map(p=>(
          <div key={p.id} style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:28}}>{p.icon}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,color:'var(--cream)'}}>{p.title}</div><div style={{fontSize:12,color:'var(--muted)'}}>{p.category} · {p.pages}pp · {p.access}</div></div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditing(p)} style={{background:'none',border:'1px solid var(--border-2)',borderRadius:8,padding:'6px 14px',color:'var(--muted)',cursor:'pointer',fontSize:12}}>Edit</button>
              <button onClick={()=>delPaper(p.id)} style={{background:'none',border:'1px solid var(--red)',borderRadius:8,padding:'6px 14px',color:'var(--red)',cursor:'pointer',fontSize:12}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatConfigTab() {
  const toast = useToast();
  const [config, setConfig] = useState({chat_enabled:'false',chat_api_key:'',chat_system_prompt:'',chat_limit_day:'20',chat_limit_week:'80',chat_limit_month:'200'});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(()=>{fetch('/api/admin/config').then(r=>r.json()).then(d=>{ if(d.settings) setConfig(s=>({...s,...d.settings})); });}, []);
  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        toast.error(d.error || 'Could not save configuration.');
      } else {
        setSaved(true); setTimeout(()=>setSaved(false),2000);
        toast.success('Chat configuration saved.');
      }
    } catch {
      toast.error('Network error. Save failed.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <h2 style={{color:'var(--cream)',marginBottom:8}}>Chat Configuration</h2>
      <p style={{color:'var(--muted)',fontSize:13,marginBottom:28}}>Configure the AI chatbot that allows members to query The Pivot Model book. API key is stored in the database.</p>
      <div style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:16,padding:28,maxWidth:640}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Chat Enabled</div>
          <div style={{display:'flex',gap:8}}>
            {['true','false'].map(v=><button key={v} onClick={()=>setConfig(p=>({...p,chat_enabled:v}))} style={{padding:'8px 20px',background:config.chat_enabled===v?'var(--gold)':'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,color:config.chat_enabled===v?'var(--gold-btn-text)':'var(--muted)',fontWeight:config.chat_enabled===v?700:400,cursor:'pointer',fontSize:13}}>{v==='true'?'Enabled':'Disabled'}</button>)}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Anthropic API Key</div>
          <input type="password" value={config.chat_api_key} onChange={e=>setConfig(p=>({...p,chat_api_key:e.target.value}))} placeholder="sk-ant-…" style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,outline:'none',fontFamily:'monospace',boxSizing:'border-box'}} />
          <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Stored in the database. Never exposed to users or client-side code.</div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>System Prompt (book context)</div>
          <textarea value={config.chat_system_prompt} onChange={e=>setConfig(p=>({...p,chat_system_prompt:e.target.value}))} rows={6} style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'10px 14px',color:'var(--cream)',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Usage Limits (per user)</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            {[['Daily limit','chat_limit_day'],['Weekly limit','chat_limit_week'],['Monthly limit','chat_limit_month']].map(([label,field])=>(
              <div key={field}>
                <div style={{fontSize:11,color:'var(--muted)',marginBottom:4}}>{label}</div>
                <input type="number" value={(config as any)[field]} onChange={e=>setConfig(p=>({...p,[field]:e.target.value}))} style={{width:'100%',background:'var(--ink)',border:'1px solid var(--border-2)',borderRadius:8,padding:'8px 12px',color:'var(--cream)',fontSize:14,fontWeight:700,outline:'none',boxSizing:'border-box'}} />
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Limits are enforced server-side using rolling time windows. Changes take effect immediately without a redeploy.</div>
        </div>
        <button onClick={save} disabled={saving} style={{background:'var(--cream)',border:'none',borderRadius:8,padding:'12px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:14,opacity:saving?0.7:1}}>
          {saving?'Saving…':saved?'✓ Saved':'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<any>({});
  useEffect(()=>{ fetch('/api/admin/config').then(r=>r.json()).then(d=>{ if(d.stats) setStats(d.stats); }); },[]);
  const cards = [['👥','Total Users',stats.users||0],['📋','Assessments',stats.assessments||0],['💬','Chat Messages',stats.chat_messages||0]];
  return (
    <div>
      <h2 style={{color:'var(--cream)',marginBottom:24}}>Platform Stats</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {cards.map(([icon,label,val])=>(
          <div key={label as string} style={{background:'var(--ink-2)',border:'1px solid var(--border-2)',borderRadius:16,padding:28,textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
            <div style={{fontSize:40,fontWeight:700,color:'var(--gold)'}}>{val as number}</div>
            <div style={{color:'var(--muted)',fontSize:14,marginTop:4}}>{label as string}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function btnSm(color:string) {
  return { background:'none' as const, border:`1px solid ${color}`, borderRadius:6, padding:'4px 10px', color, cursor:'pointer' as const, fontSize:11, fontWeight:600 as const };
}
