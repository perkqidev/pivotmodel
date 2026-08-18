'use client';
/**
 * TEMPORARY local review page — http://localhost:3000/preview-post
 *
 * Renders the sample article through the real reader and the real block editor
 * without needing a database or a login, so the design can be reviewed before
 * the post exists in Postgres. Delete this route once the real flow is live.
 */
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import article from '@/content/blog/three-depths.json';
import { BlockRenderer } from '@/components/blog/BlockRenderer';
import { BlockEditor } from '@/components/admin/BlockEditor';
import { PostDetails } from '@/components/admin/PostDetails';
import { BlockDoc, estimateReadTime, parseBody, serializeBody } from '@/lib/blog/blocks';

export default function PreviewPost() {
  const [tab, setTab] = useState<'reader'|'editor'>('reader');
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const [doc, setDoc] = useState<BlockDoc>(() => parseBody(JSON.stringify({ version:1, blocks: article.blocks })));
  const [meta, setMeta] = useState({
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    hero_image: article.hero_image,
    emoji: article.emoji,
    read_time: String(article.read_time),
    status: 'draft',
  });

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  // Local design-review tool only — never served from the deployed site.
  if (process.env.NODE_ENV === 'production') notFound();

  const bar: React.CSSProperties = {
    position:'sticky', top:0, zIndex:50, display:'flex', gap:10, alignItems:'center',
    padding:'12px 24px', background:'var(--ink-2)', borderBottom:'1px solid var(--border)',
  };
  const tabBtn = (active:boolean): React.CSSProperties => ({
    background: active ? 'var(--surface)' : 'none', border:'1px solid var(--border-2)', borderRadius:8,
    padding:'7px 16px', color: active ? 'var(--fg)' : 'var(--muted)', cursor:'pointer', fontSize:14, fontWeight:600,
  });

  return (
    <div style={{ minHeight:'100vh', background:'var(--ink)' }}>
      <div style={bar}>
        <span style={{ color:'var(--muted-2)', fontSize:12, letterSpacing:'.1em', textTransform:'uppercase' }}>Preview</span>
        <button onClick={()=>setTab('reader')} style={tabBtn(tab==='reader')}>Reader</button>
        <button onClick={()=>setTab('editor')} style={tabBtn(tab==='editor')}>Editor</button>
        <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} style={{ ...tabBtn(false), marginLeft:'auto' }}>
          {theme==='dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </div>

      {tab === 'reader' ? (
        <div style={{ padding:'44px 24px 80px' }}>
          <article className="post" style={{ margin:'0 auto' }}>
            <div className="post-meta">{[meta.category, `${Number(meta.read_time) || estimateReadTime(doc)} min read`].filter(Boolean).join(' · ')}</div>
            <h1 className="post-title">{meta.title || 'Untitled'}</h1>
            {meta.excerpt && <p className="post-lead">{meta.excerpt}</p>}
            {meta.hero_image && <img src={meta.hero_image} alt="" className="post-hero" />}
            <BlockRenderer blocks={doc.blocks} />
            <div className="post-foot">The Pivot Model</div>
          </article>
        </div>
      ) : (
        <div style={{ padding:'28px 24px 80px', maxWidth:900, margin:'0 auto' }}>
          <p style={{ color:'var(--muted)', marginBottom:20, fontSize:14 }}>
            The real editor from /admin. Everything here is live — edit and switch to the Reader tab to see it.
            The image library needs a database, so “Choose image” won’t load until that’s connected.
          </p>

          <PostDetails value={meta} onChange={patch => setMeta(p => ({ ...p, ...patch } as typeof meta))} readTimeHint={estimateReadTime(doc)} />
          <BlockEditor doc={doc} onChange={setDoc} />
          <details style={{ marginTop:28, color:'var(--muted)' }}>
            <summary style={{ cursor:'pointer', fontSize:14 }}>What gets saved to the database</summary>
            <pre style={{ marginTop:12, padding:16, background:'var(--ink-2)', border:'1px solid var(--border-2)', borderRadius:10, overflowX:'auto', fontSize:12, color:'var(--muted)' }}>
{serializeBody(doc).slice(0, 1200)}…
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
