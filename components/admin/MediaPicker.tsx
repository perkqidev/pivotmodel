'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/shared/Toast/ToastProvider';

export interface MediaItem {
  id: number; key: string; filename: string; mime: string; size: number; created_at: string;
}

const overlay: React.CSSProperties = {
  position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.55)',
  display:'flex', alignItems:'center', justifyContent:'center', padding:24,
};
const panel: React.CSSProperties = {
  background:'var(--ink-2)', border:'1px solid var(--border-2)', borderRadius:16,
  width:'min(880px,100%)', maxHeight:'86vh', display:'flex', flexDirection:'column',
};
const btn: React.CSSProperties = {
  background:'none', border:'1px solid var(--border-2)', borderRadius:8,
  padding:'8px 14px', color:'var(--muted)', cursor:'pointer', fontSize:14,
};

function prettySize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Long edge a stored image is capped at — plenty for a 720px article column
 *  on a high-density screen, without putting camera-sized files in Postgres. */
const MAX_EDGE = 2400;

/**
 * Shrink oversized images in the browser before upload. Returns the original
 * file when it's already small enough, when it's an animated GIF, or whenever
 * re-encoding wouldn't actually save anything.
 */
async function shrink(file: File): Promise<File> {
  if (file.type === 'image/gif') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const { width, height } = bitmap;
  if (Math.max(width, height) <= MAX_EDGE && file.size <= 1_500_000) { bitmap.close?.(); return file; }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close?.(); return file; }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // PNG keeps its transparency; everything else is cheaper as JPEG.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.85));
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, type === 'image/png' ? '.png' : '.jpg');
  return new File([blob], name, { type });
}

/** Modal image library: upload several at once, then click one to use it. */
export function MediaPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/media')
      .then(r => r.json())
      .then(d => setItems(d.media || []))
      .catch(() => toast.error('Could not load the image library.'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const before = list.reduce((n, f) => n + f.size, 0);
      const prepared = await Promise.all(list.map(shrink));
      const after = prepared.reduce((n, f) => n + f.size, 0);
      if (after < before * 0.9) toast.success(`Resized for the web — ${prettySize(before)} → ${prettySize(after)}.`);

      const form = new FormData();
      prepared.forEach(f => form.append('files', f));
      const res = await fetch('/api/media', { method: 'POST', body: form });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d.error || 'Upload failed.'); return; }
      (d.rejected || []).forEach((r: any) => toast.error(`${r.filename}: ${r.reason}`));
      if (d.uploaded?.length) toast.success(`Uploaded ${d.uploaded.length} image${d.uploaded.length > 1 ? 's' : ''}.`);
      load();
    } catch {
      toast.error('Network error during upload.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MediaItem) {
    if (!confirm(`Delete ${item.filename}? Posts using it will show a broken image.`)) return;
    const res = await fetch('/api/media', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    });
    if (!res.ok) { toast.error('Delete failed.'); return; }
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:700, color:'var(--cream)', fontSize:18 }}>Images</div>
          <button onClick={onClose} style={btn}>Close</button>
        </div>

        <div style={{ padding:24, overflowY:'auto' }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border:`1px dashed ${dragging ? 'var(--gold)' : 'var(--border-2)'}`,
              background: dragging ? 'var(--gold-bg)' : 'transparent',
              borderRadius:12, padding:'26px 20px', textAlign:'center', cursor:'pointer', marginBottom:24,
            }}
          >
            <div style={{ color:'var(--cream)', fontWeight:600, marginBottom:4 }}>
              {busy ? 'Uploading…' : 'Drop images here, or click to choose'}
            </div>
            <div style={{ color:'var(--muted)', fontSize:14 }}>Several at once. JPG, PNG, WebP or GIF, up to 8&nbsp;MB each — anything larger than {MAX_EDGE}px is resized for the web automatically.</div>
            <input
              ref={fileRef} type="file" accept="image/*" multiple hidden
              onChange={e => { if (e.target.files) upload(e.target.files); e.target.value = ''; }}
            />
          </div>

          {loading ? (
            <div style={{ color:'var(--muted)' }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ color:'var(--muted)' }}>No images yet. Upload the first one above.</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16 }}>
              {items.map(item => (
                <div key={item.id} style={{ border:'1px solid var(--border-2)', borderRadius:12, overflow:'hidden', background:'var(--ink)' }}>
                  <button
                    onClick={() => { onSelect(`/api/media/${item.key}`); onClose(); }}
                    title="Use this image"
                    style={{ display:'block', width:'100%', border:'none', padding:0, background:'none', cursor:'pointer' }}
                  >
                    <img src={`/api/media/${item.key}`} alt={item.filename}
                         style={{ width:'100%', height:110, objectFit:'cover', display:'block' }} />
                  </button>
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ color:'var(--cream)', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.filename}</div>
                    <div style={{ color:'var(--muted)', fontSize:12, marginTop:2 }}>{prettySize(item.size)}</div>
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <button onClick={() => { navigator.clipboard?.writeText(`/api/media/${item.key}`); toast.success('URL copied.'); }}
                              style={{ ...btn, padding:'4px 10px', fontSize:12 }}>Copy URL</button>
                      <button onClick={() => remove(item)}
                              style={{ ...btn, padding:'4px 10px', fontSize:12, borderColor:'var(--red)', color:'var(--red)' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Image control: the picture itself is the button, with actions on hover. */
export function ImageField({ label, url, onChange }: { label: string; url: string; onChange: (url: string) => void }) {
  const [picking, setPicking] = useState(false);
  const [over, setOver] = useState(false);

  return (
    <div>
      {label && <div style={{ fontSize:10, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--muted-2)', marginBottom:8 }}>{label}</div>}

      {url ? (
        <div onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}
             style={{ position:'relative', display:'inline-block', borderRadius:12, overflow:'hidden', border:'1px solid var(--border)', lineHeight:0, maxWidth:'100%' }}>
          <img src={url} alt="" style={{ display:'block', maxWidth:'100%', maxHeight:190, objectFit:'cover' }} />
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            gap:8, padding:10, flexWrap:'wrap', alignContent:'center',
            background:'rgba(10,12,18,.62)', opacity: over ? 1 : 0, transition:'opacity .15s',
          }}>
            <button onClick={() => setPicking(true)} style={overlayBtn}>Replace</button>
            <button onClick={() => onChange('')} style={overlayBtn}>Remove</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setPicking(true)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
                  width:'100%', minHeight:120, padding:'20px', cursor:'pointer',
                  background:'none', border:'1px dashed var(--border-2)', borderRadius:12, color:'var(--muted)',
                  fontFamily:'var(--font-body)', fontSize:14,
                }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m3 16 5-4 4 3 3-2 6 5" />
          </svg>
          Choose an image
        </button>
      )}

      {picking && <MediaPicker onSelect={onChange} onClose={() => setPicking(false)} />}
    </div>
  );
}

/* Kept compact and wrappable — the image can be as narrow as a 180px column,
   and full-size buttons were being clipped by its edges. */
const overlayBtn: React.CSSProperties = {
  background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.45)', borderRadius:7,
  padding:'6px 12px', color:'#fff', cursor:'pointer', fontSize:12, lineHeight:1.4,
  fontFamily:'var(--font-body)', whiteSpace:'nowrap', backdropFilter:'blur(4px)',
};
