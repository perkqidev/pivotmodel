'use client';
import { useState, useEffect } from 'react';

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

  if (checking) return <div style={{minHeight:'100vh',background:'#0A0C17',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B7280'}}>Checking access…</div>;
  if (!authed) return <div style={{minHeight:'100vh',background:'#0A0C17',display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444',fontSize:18}}>Access denied. Admin only.</div>;

  const TABS: {id:Tab;label:string}[] = [{id:'users',label:'👥 Users'},{id:'blog',label:'✍️ Blog'},{id:'whitepapers',label:'📄 Whitepapers'},{id:'chat',label:'💬 Chat Config'},{id:'stats',label:'📊 Stats'}];

  return (
    <div style={{minHeight:'100vh',background:'#0A0C17',color:'#F5F0E8'}}>
      <div style={{background:'#12152A',borderBottom:'1px solid #2A2D3E',padding:'0 32px',display:'flex',alignItems:'center',gap:32}}>
        <div style={{padding:'16px 0',fontWeight:700,fontSize:16,color:'#C9A84C',letterSpacing:'0.05em'}}>PIVOT MODEL · ADMIN</div>
        <div style={{display:'flex',gap:4,flex:1}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'16px 20px',background:'none',border:'none',borderBottom:`3px solid ${tab===t.id?'#C9A84C':'transparent'}`,color:tab===t.id?'#C9A84C':'#6B7280',fontSize:13,fontWeight:tab===t.id?700:400,cursor:'pointer'}}>{t.label}</button>)}
        </div>
        <a href="/community" style={{fontSize:13,color:'#6B7280',textDecoration:'none'}}>← Back to portal</a>
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
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(()=>{fetch('/api/admin/users').then(r=>r.json()).then(d=>setUsers(d.users||[]));}, []);
  async function action(userId:number, act:string) {
    await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:act,userId})});
    fetch('/api/admin/users').then(r=>r.json()).then(d=>setUsers(d.users||[]));
  }
  const filtered = users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase())||u.company?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0,color:'#F5F0E8'}}>Users ({users.length})</h2>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:8,padding:'8px 14px',color:'#F5F0E8',fontSize:13,outline:'none',width:240}} />
      </div>
      <div style={{background:'#12152A',borderRadius:12,overflow:'hidden',border:'1px solid #2A2D3E'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1.5fr 1fr 80px 100px 100px 200px',padding:'10px 16px',background:'#0A0C17',fontSize:11,fontWeight:600,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          <div>Name</div><div>Email</div><div>Company</div><div>Assessments</div><div>Status</div><div>Admin</div><div>Chat (30d)</div><div>Actions</div>
        </div>
        {filtered.map((u,i)=>(
          <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 2fr 1.5fr 1fr 80px 100px 100px 200px',padding:'12px 16px',borderTop:'1px solid #2A2D3E',background:i%2===0?'transparent':'rgba(255,255,255,0.01)',alignItems:'center'}}>
            <div style={{color:'#F5F0E8',fontSize:13,fontWeight:500}}>{u.name}</div>
            <div style={{color:'#8A8FA8',fontSize:12}}>{u.email}</div>
            <div style={{color:'#8A8FA8',fontSize:12}}>{u.company||'—'}</div>
            <div style={{color:'#8A8FA8',fontSize:13}}>{u.assessment_count||0}</div>
            <div style={{color:u.status==='active'?'#22c55e':'#ef4444',fontSize:12,fontWeight:600}}>{u.status}</div>
            <div style={{color:u.is_admin?'#C9A84C':'#6B7280',fontSize:12,fontWeight:600}}>{u.is_admin?'Admin':'Member'}</div>
            <div style={{color:'#8A8FA8',fontSize:12}}>{u.chat_month||0} msgs</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {u.status==='active' ? <button onClick={()=>action(u.id,'deactivate')} style={btnSm('#ef4444')}>Deactivate</button> : <button onClick={()=>action(u.id,'activate')} style={btnSm('#22c55e')}>Activate</button>}
              {u.is_admin ? <button onClick={()=>action(u.id,'demote')} style={btnSm('#6B7280')}>Demote</button> : <button onClick={()=>action(u.id,'promote')} style={btnSm('#C9A84C')}>Make Admin</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any|null>(null);
  useEffect(()=>{fetch('/api/blog?all=1').then(r=>r.json()).then(d=>setPosts(d.posts||[]));}, []);
  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    await fetch('/api/blog',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(editing)});
    fetch('/api/blog?all=1').then(r=>r.json()).then(d=>setPosts(d.posts||[]));
    setEditing(null);
  }
  async function del(id:number) {
    if (!confirm('Delete this post?')) return;
    await fetch('/api/blog',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    setPosts(prev=>prev.filter(p=>p.id!==id));
  }
  if (editing) return (
    <div>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:24}}>
        <button onClick={()=>setEditing(null)} style={{background:'none',border:'1px solid #2A2D3E',borderRadius:8,padding:'8px 14px',color:'#6B7280',cursor:'pointer',fontSize:13}}>← Cancel</button>
        <h2 style={{margin:0,color:'#F5F0E8'}}>{editing.id?'Edit Post':'New Post'}</h2>
      </div>
      <div style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:16,padding:24,display:'grid',gap:16}}>
        {[['Title','title','input',''],['Category','category','input',''],['Excerpt','excerpt','textarea',''],['Body','body','textarea',''],['Emoji','emoji','input',''],['Read time (min)','read_time','input','']].map(([label,field,type,ph])=>(
          <div key={field as string}>
            <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label as string}</div>
            {type==='textarea' ? <textarea value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} rows={6} style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}} /> : <input value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,outline:'none',boxSizing:'border-box'}} />}
          </div>
        ))}
        <div>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</div>
          <select value={editing.status||'draft'} onChange={e=>setEditing((p:any)=>({...p,status:e.target.value}))} style={{background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,cursor:'pointer',outline:'none'}}>
            <option value="draft">Draft</option><option value="published">Published</option>
          </select>
        </div>
        <button onClick={save} style={{background:'#C9A84C',border:'none',borderRadius:8,padding:'12px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:14}}>Save Post</button>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0,color:'#F5F0E8'}}>Blog Posts ({posts.length})</h2>
        <button onClick={()=>setEditing({title:'',category:'',excerpt:'',body:'',emoji:'📝',read_time:4,status:'draft'})} style={{background:'#C9A84C',border:'none',borderRadius:8,padding:'10px 20px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer'}}>+ New Post</button>
      </div>
      <div style={{display:'grid',gap:12}}>
        {posts.map(p=>(
          <div key={p.id} style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:28}}>{p.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:'#F5F0E8'}}>{p.title}</div>
              <div style={{fontSize:12,color:'#6B7280',marginTop:2}}>{p.category} · {p.status} · {p.read_time}min</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditing(p)} style={{background:'none',border:'1px solid #2A2D3E',borderRadius:8,padding:'6px 14px',color:'#8A8FA8',cursor:'pointer',fontSize:12}}>Edit</button>
              <button onClick={()=>del(p.id)} style={{background:'none',border:'1px solid #ef4444',borderRadius:8,padding:'6px 14px',color:'#ef4444',cursor:'pointer',fontSize:12}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhitepapersTab() {
  const [papers, setPapers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any|null>(null);
  useEffect(()=>{fetch('/api/whitepapers?all=1').then(r=>r.json()).then(d=>setPapers(d.whitepapers||[])).catch(()=>{});}, []);
  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    await fetch('/api/whitepapers',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(editing)});
    fetch('/api/whitepapers?all=1').then(r=>r.json()).then(d=>setPapers(d.whitepapers||[])).catch(()=>{});
    setEditing(null);
  }
  if (editing) return (
    <div>
      <button onClick={()=>setEditing(null)} style={{background:'none',border:'1px solid #2A2D3E',borderRadius:8,padding:'8px 14px',color:'#6B7280',cursor:'pointer',fontSize:13,marginBottom:20}}>← Cancel</button>
      <div style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:16,padding:24,display:'grid',gap:16}}>
        {[['Title','title','input'],['Category','category','input'],['Description','description','textarea'],['Icon (emoji)','icon','input'],['Pages','pages','input'],['File URL','file_url','input']].map(([label,field,type])=>(
          <div key={field as string}>
            <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label as string}</div>
            {type==='textarea' ? <textarea value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} rows={3} style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}} /> : <input value={editing[field as string]||''} onChange={e=>setEditing((p:any)=>({...p,[field as string]:e.target.value}))} style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,outline:'none',boxSizing:'border-box'}} />}
          </div>
        ))}
        <div>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Access</div>
          <select value={editing.access||'members'} onChange={e=>setEditing((p:any)=>({...p,access:e.target.value}))} style={{background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,cursor:'pointer',outline:'none'}}>
            <option value="public">Public</option><option value="members">Members only</option>
          </select>
        </div>
        <button onClick={save} style={{background:'#C9A84C',border:'none',borderRadius:8,padding:'12px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:14}}>Save</button>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0,color:'#F5F0E8'}}>Whitepapers</h2>
        <button onClick={()=>setEditing({title:'',category:'',description:'',icon:'📄',pages:1,access:'members',file_url:''})} style={{background:'#C9A84C',border:'none',borderRadius:8,padding:'10px 20px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer'}}>+ Add Whitepaper</button>
      </div>
      <div style={{display:'grid',gap:12}}>
        {papers.map(p=>(
          <div key={p.id} style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:28}}>{p.icon}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,color:'#F5F0E8'}}>{p.title}</div><div style={{fontSize:12,color:'#6B7280'}}>{p.category} · {p.pages}pp · {p.access}</div></div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setEditing(p)} style={{background:'none',border:'1px solid #2A2D3E',borderRadius:8,padding:'6px 14px',color:'#8A8FA8',cursor:'pointer',fontSize:12}}>Edit</button>
              <button onClick={async()=>{await fetch('/api/whitepapers',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id})});setPapers(prev=>prev.filter(x=>x.id!==p.id));}} style={{background:'none',border:'1px solid #ef4444',borderRadius:8,padding:'6px 14px',color:'#ef4444',cursor:'pointer',fontSize:12}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatConfigTab() {
  const [config, setConfig] = useState({chat_enabled:'false',chat_api_key:'',chat_system_prompt:'',chat_limit_day:'20',chat_limit_week:'80',chat_limit_month:'200'});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(()=>{fetch('/api/admin/config').then(r=>r.json()).then(d=>{ if(d.settings) setConfig(s=>({...s,...d.settings})); });}, []);
  async function save() {
    setSaving(true);
    await fetch('/api/admin/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }
  return (
    <div>
      <h2 style={{color:'#F5F0E8',marginBottom:8}}>Chat Configuration</h2>
      <p style={{color:'#6B7280',fontSize:13,marginBottom:28}}>Configure the AI chatbot that allows members to query The Pivot Model book. API key is stored in the database.</p>
      <div style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:16,padding:28,maxWidth:640}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Chat Enabled</div>
          <div style={{display:'flex',gap:8}}>
            {['true','false'].map(v=><button key={v} onClick={()=>setConfig(p=>({...p,chat_enabled:v}))} style={{padding:'8px 20px',background:config.chat_enabled===v?'#C9A84C':'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,color:config.chat_enabled===v?'#000':'#8A8FA8',fontWeight:config.chat_enabled===v?700:400,cursor:'pointer',fontSize:13}}>{v==='true'?'Enabled':'Disabled'}</button>)}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Anthropic API Key</div>
          <input type="password" value={config.chat_api_key} onChange={e=>setConfig(p=>({...p,chat_api_key:e.target.value}))} placeholder="sk-ant-…" style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,outline:'none',fontFamily:'monospace',boxSizing:'border-box'}} />
          <div style={{fontSize:11,color:'#6B7280',marginTop:4}}>Stored in the database. Never exposed to users or client-side code.</div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>System Prompt (book context)</div>
          <textarea value={config.chat_system_prompt} onChange={e=>setConfig(p=>({...p,chat_system_prompt:e.target.value}))} rows={6} style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'10px 14px',color:'#F5F0E8',fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,color:'#6B7280',marginBottom:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Usage Limits (per user)</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            {[['Daily limit','chat_limit_day'],['Weekly limit','chat_limit_week'],['Monthly limit','chat_limit_month']].map(([label,field])=>(
              <div key={field}>
                <div style={{fontSize:11,color:'#6B7280',marginBottom:4}}>{label}</div>
                <input type="number" value={(config as any)[field]} onChange={e=>setConfig(p=>({...p,[field]:e.target.value}))} style={{width:'100%',background:'#0A0C17',border:'1px solid #2A2D3E',borderRadius:8,padding:'8px 12px',color:'#F5F0E8',fontSize:14,fontWeight:700,outline:'none',boxSizing:'border-box'}} />
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:'#6B7280',marginTop:8}}>Limits are enforced server-side using rolling time windows. Changes take effect immediately without a redeploy.</div>
        </div>
        <button onClick={save} disabled={saving} style={{background:'#C9A84C',border:'none',borderRadius:8,padding:'12px 24px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:14,opacity:saving?0.7:1}}>
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
      <h2 style={{color:'#F5F0E8',marginBottom:24}}>Platform Stats</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {cards.map(([icon,label,val])=>(
          <div key={label as string} style={{background:'#12152A',border:'1px solid #2A2D3E',borderRadius:16,padding:28,textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
            <div style={{fontSize:40,fontWeight:700,color:'#C9A84C'}}>{val as number}</div>
            <div style={{color:'#6B7280',fontSize:14,marginTop:4}}>{label as string}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function btnSm(color:string) {
  return { background:'none' as const, border:`1px solid ${color}`, borderRadius:6, padding:'4px 10px', color, cursor:'pointer' as const, fontSize:11, fontWeight:600 as const };
}
