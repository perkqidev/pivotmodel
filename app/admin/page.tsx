'use client';
import { useState, useEffect } from 'react';

interface User { id: number; name: string; email: string; company: string; role: string; status: string; is_admin: number; joined_at: string; last_login: string }
interface Lead { id: number; name: string; email: string; company: string; role: string; service: string; status: string; submitted_at: string; challenges: string; current_operation: string }
interface BlogPost { id: number; title: string; category: string; status: string; published_at: string; emoji: string; read_time: number; excerpt: string }

type Tab = 'members' | 'leads' | 'blog' | 'whitepapers';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<Tab>('members');
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editPost, setEditPost] = useState<Partial<BlogPost> | null>(null);

  async function checkAdmin() {
    const res = await fetch('/api/auth/login');
    const d = await res.json();
    if (d.user?.isAdmin) setAuthed(true);
  }
  useEffect(() => { checkAdmin(); }, []);

  async function login() {
    // Simple: try to get session and check isAdmin
    // In production, admin login would be a separate secure flow
    setErr('Please log in via the community page first, then return here if you are an admin.');
  }

  useEffect(() => {
    if (!authed) return;
    fetch('/api/members?all=1').then(r => r.json()).then(d => setUsers(d.users || []));
    fetch('/api/leads').then(r => r.json()).then(d => setLeads(d.leads || []));
    fetch('/api/blog').then(r => r.json()).then(d => setPosts(d.posts || []));
  }, [authed]);

  async function toggleStatus(userId: number, status: string) {
    await fetch('/api/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_status', userId, status }) });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  }

  async function updateLeadStatus(id: number, status: string) {
    await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function savePost() {
    if (!editPost) return;
    const method = editPost.id ? 'PUT' : 'POST';
    await fetch('/api/blog', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editPost, readTime: editPost.read_time }) });
    setEditPost(null);
    fetch('/api/blog').then(r => r.json()).then(d => setPosts(d.posts || []));
  }

  async function deletePost(id: number) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#0A0C17', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ background: '#12152A', border: '1px solid rgba(255,255,255,.1)', borderTop: '3px solid #C9A84C', borderRadius: 8, padding: 32, width: 360 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#C9A84C', marginBottom: 8 }}>Admin Panel</div>
        <div style={{ color: '#8A8FA8', fontSize: 13, marginBottom: 20 }}>The Pivot Model</div>
        {err && <div style={{ padding: '10px 14px', borderRadius: 4, background: 'rgba(232,139,126,.1)', border: '1px solid rgba(232,139,126,.3)', color: '#e88b7e', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#5A5F78', marginBottom: 4, display: 'block' }}>Access</label>
          <div style={{ color: '#8A8FA8', fontSize: 13, lineHeight: 1.6 }}>
            Log in via the <a href="/community" style={{ color: '#C9A84C' }}>community page</a> with your admin account to access this panel.
          </div>
        </div>
        <button onClick={checkAdmin} style={{ width: '100%', background: '#C9A84C', color: '#0A0C17', border: 'none', borderRadius: 4, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Check Admin Status
        </button>
      </div>
    </div>
  );

  const tabStyle = (t: Tab) => ({
    padding: '9px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: tab === t ? '#C9A84C' : 'transparent',
    color: tab === t ? '#0A0C17' : '#8A8FA8',
    border: 'none', fontFamily: 'inherit',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0A0C17', fontFamily: 'DM Sans, sans-serif', color: '#F5F0E8' }}>
      {/* Header */}
      <div style={{ background: '#12152A', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 32px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: '#C9A84C' }}>THE PIVOT MODEL · Admin</div>
        <a href="/community" style={{ fontSize: 13, color: '#8A8FA8' }}>← Back to Community</a>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {(['members', 'leads', 'blog', 'whitepapers'] as Tab[]).map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {{ members: '👥 Members', leads: '🎯 Leads', blog: '📝 Blog', whitepapers: '📄 Whitepapers' }[t]}
            </button>
          ))}
        </div>

        {/* Members */}
        {tab === 'members' && (
          <div>
            <div style={{ marginBottom: 16, color: '#8A8FA8', fontSize: 13 }}>{users.length} members</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['Name', 'Email', 'Company', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ background: '#1C2040', color: '#5A5F78', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,.07)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <td style={{ padding: '10px 12px', color: '#F5F0E8', fontWeight: 600 }}>{u.name}{u.is_admin ? ' ⭐' : ''}</td>
                    <td style={{ padding: '10px 12px', color: '#8A8FA8' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', color: '#8A8FA8' }}>{u.company}</td>
                    <td style={{ padding: '10px 12px', color: '#8A8FA8' }}>{u.role}</td>
                    <td style={{ padding: '10px 12px', color: '#5A5F78' }}>{new Date(u.joined_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: u.status === 'active' ? 'rgba(126,232,162,.12)' : 'rgba(232,139,126,.12)', color: u.status === 'active' ? '#7ee8a2' : '#e88b7e', border: `1px solid ${u.status === 'active' ? 'rgba(126,232,162,.25)' : 'rgba(232,139,126,.3)'}` }}>{u.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => toggleStatus(u.id, u.status === 'active' ? 'suspended' : 'active')} style={{ background: 'none', border: '1px solid rgba(255,255,255,.15)', color: '#8A8FA8', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leads */}
        {tab === 'leads' && (
          <div>
            <div style={{ marginBottom: 16, color: '#8A8FA8', fontSize: 13 }}>{leads.length} consulting inquiries</div>
            {leads.map(l => (
              <div key={l.id} style={{ background: '#12152A', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: 18, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#F5F0E8' }}>{l.name} <span style={{ fontWeight: 400, color: '#8A8FA8' }}>· {l.company} · {l.role}</span></div>
                    <div style={{ fontSize: 12, color: '#8A8FA8' }}>{l.email} · {l.service || 'General'} · {new Date(l.submitted_at).toLocaleDateString()}</div>
                  </div>
                  <select value={l.status} onChange={e => updateLeadStatus(l.id, e.target.value)}
                    style={{ background: '#1C2040', border: '1px solid rgba(255,255,255,.1)', color: '#F5F0E8', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }}>
                    {['new', 'contacted', 'converted', 'closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {l.challenges && <div style={{ fontSize: 12, color: '#8A8FA8', lineHeight: 1.6 }}><strong style={{ color: '#5A5F78' }}>Challenges:</strong> {l.challenges}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Blog */}
        {tab === 'blog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ color: '#8A8FA8', fontSize: 13 }}>{posts.length} posts</div>
              <button onClick={() => setEditPost({ emoji: '📝', read_time: 4, status: 'draft', category: '' })}
                style={{ background: '#C9A84C', color: '#0A0C17', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + New Post
              </button>
            </div>
            {posts.map(p => (
              <div key={p.id} style={{ background: '#12152A', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#F5F0E8', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: '#8A8FA8' }}>{p.category} · {p.status} · {p.read_time}min</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditPost(p)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.15)', color: '#8A8FA8', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => deletePost(p.id)} style={{ background: 'none', border: '1px solid rgba(232,139,126,.3)', color: '#e88b7e', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                </div>
              </div>
            ))}

            {/* Edit/Create post modal */}
            {editPost && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ background: '#12152A', border: '1px solid rgba(255,255,255,.13)', borderRadius: 8, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#F5F0E8' }}>{editPost.id ? 'Edit Post' : 'New Post'}</span>
                    <button onClick={() => setEditPost(null)} style={{ background: 'none', border: 'none', color: '#8A8FA8', fontSize: 20, cursor: 'pointer' }}>×</button>
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Title', key: 'title', type: 'input', placeholder: 'Post title' },
                      { label: 'Category', key: 'category', type: 'input', placeholder: 'e.g. Engineering Maturity' },
                      { label: 'Emoji', key: 'emoji', type: 'input', placeholder: '📝' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#5A5F78', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
                        <input value={(editPost as Record<string, unknown>)[f.key] as string || ''} onChange={e => setEditPost(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{ width: '100%', background: '#1C2040', border: '1px solid rgba(255,255,255,.13)', color: '#F5F0E8', padding: '8px 12px', borderRadius: 4, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#5A5F78', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Excerpt</label>
                      <textarea value={editPost.excerpt || ''} onChange={e => setEditPost(prev => ({ ...prev, excerpt: e.target.value }))} rows={2}
                        style={{ width: '100%', background: '#1C2040', border: '1px solid rgba(255,255,255,.13)', color: '#F5F0E8', padding: '8px 12px', borderRadius: 4, fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#5A5F78', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</label>
                      <select value={editPost.status || 'draft'} onChange={e => setEditPost(prev => ({ ...prev, status: e.target.value }))}
                        style={{ background: '#1C2040', border: '1px solid rgba(255,255,255,.13)', color: '#F5F0E8', padding: '8px 12px', borderRadius: 4, fontFamily: 'inherit', fontSize: 13 }}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button onClick={() => setEditPost(null)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.15)', color: '#8A8FA8', borderRadius: 4, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                      <button onClick={savePost} style={{ background: '#C9A84C', color: '#0A0C17', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'whitepapers' && (
          <div>
            <div style={{ color: '#8A8FA8', fontSize: 13, marginBottom: 16 }}>Manage whitepapers via the database or contact your developer to add entries.</div>
          </div>
        )}
      </div>
    </div>
  );
}
