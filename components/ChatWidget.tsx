'use client';
import { useState, useEffect, useRef } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ day: 0, week: 0, month: 0 });
  const [limits, setLimits] = useState({ day: 20, week: 80, month: 200 });
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat').then(r => r.json()).then(d => {
      if (d.enabled) { setEnabled(true); setUsage(d.usage); setLimits(d.limits); }
    }).catch(() => {});
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const history = messages.slice(-10);
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, history }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Error'); } else {
        setMessages(prev => [...prev, { role: 'assistant', content: d.reply }]);
        setUsage(prev => ({ ...prev, day: prev.day + 1, week: prev.week + 1, month: prev.month + 1 }));
      }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }

  if (!enabled) return null;

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{ position:'fixed',bottom:24,right:24,width:56,height:56,borderRadius:'50%',background:'var(--gold)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.3)',zIndex:1000,fontSize:24 }}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div style={{ position:'fixed',bottom:90,right:24,width:360,height:520,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,display:'flex',flexDirection:'column',zIndex:1000,boxShadow:'0 8px 40px rgba(0,0,0,0.4)',overflow:'hidden' }}>
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700,color:'var(--fg)',fontSize:15 }}>Ask the Book</div>
              <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{limits.day - usage.day} messages left today</div>
            </div>
            <div style={{ fontSize:11,color:'var(--muted)',textAlign:'right' }}>
              <div>Day: {usage.day}/{limits.day}</div>
              <div>Month: {usage.month}/{limits.month}</div>
            </div>
          </div>
          <div style={{ flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12 }}>
            {messages.length === 0 && (
              <div style={{ color:'var(--muted)',fontSize:13,textAlign:'center',marginTop:40 }}>
                Ask anything about The Pivot Model book — engineering maturity, offshore operations, or the EMB framework.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'85%',padding:'10px 14px',borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',background:m.role==='user'?'var(--gold)':'var(--card)',color:m.role==='user'?'#000':'var(--fg)',fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex',justifyContent:'flex-start' }}>
                <div style={{ padding:'10px 14px',borderRadius:'16px 16px 16px 4px',background:'var(--card)',color:'var(--muted)',fontSize:13 }}>Thinking…</div>
              </div>
            )}
            {error && <div style={{ color:'#ef4444',fontSize:12,textAlign:'center' }}>{error}</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding:12,borderTop:'1px solid var(--border)',display:'flex',gap:8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask about the book…" style={{ flex:1,background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none' }} />
            <button onClick={send} disabled={loading||!input.trim()} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,fontSize:13,cursor:'pointer',opacity:loading||!input.trim()?0.5:1 }}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
