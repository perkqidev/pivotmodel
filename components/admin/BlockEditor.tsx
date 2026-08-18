'use client';
import { useState } from 'react';
import s from './BlockEditor.module.css';
import {
  Block, BlockDoc, BlockType, BLOCK_LABEL, BLOCK_MENU,
  emptyBlock, imageLayoutId, imageWidth, IMAGE_LAYOUTS,
} from '@/lib/blog/blocks';
import { ImageField } from './MediaPicker';

/** Offered directly on the add bar; the rest live behind "More". */
const COMMON: BlockType[] = ['text', 'heading', 'image', 'list', 'quote'];

/** Block types with fields worth hiding until asked for. */
const HAS_OPTIONS = new Set<BlockType>(['image', 'imageText', 'gallery', 'quote', 'callout', 'list', 'heading']);

const HINT = '**bold** · *italic* · `code` · [label](url)';

/* ── icons ─────────────────────────────────────────────────────── */
const svg = { width:15, height:15, viewBox:'0 0 16 16', fill:'none', stroke:'currentColor', strokeWidth:1.5, strokeLinecap:'round' as const, strokeLinejoin:'round' as const };
const IconUp = () => <svg {...svg}><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>;
const IconDown = () => <svg {...svg}><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" /></svg>;
const IconCopy = () => <svg {...svg}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 3.5h-7a1 1 0 0 0-1 1v7" /></svg>;
const IconTrash = () => <svg {...svg}><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5 5 13h6l.5-8.5" /></svg>;
const IconSliders = () => <svg {...svg}><path d="M2.5 5h11M2.5 11h11" /><circle cx="6" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="10" cy="11" r="1.6" fill="currentColor" stroke="none" /></svg>;
const IconPlus = () => <svg {...svg} width={13} height={13}><path d="M8 3.5v9M3.5 8h9" /></svg>;

/** Height for a textarea so it grows with its content instead of scrolling. */
function rowsFor(text: string, min = 2) {
  return Math.max(min, Math.min(40, (text || '').split('\n').reduce((n, line) => n + 1 + Math.floor(line.length / 74), 0)));
}

function Auto({ value, onChange, className, placeholder, min }: {
  value: string; onChange: (v:string)=>void; className: string; placeholder?: string; min?: number;
}) {
  return (
    <textarea className={`${s.bare} ${className}`} value={value} placeholder={placeholder}
              rows={rowsFor(value, min)} onChange={e => onChange(e.target.value)} />
  );
}

function Opt({ label, children }: { label:string; children:React.ReactNode }) {
  return <div><div className={s.optLabel}>{label}</div>{children}</div>;
}

function Seg({ options, value, onChange }: { options:[any,string][]; value:any; onChange:(v:any)=>void }) {
  return (
    <div className={s.seg}>
      {options.map(([v, label]) => (
        <button key={String(v)} onClick={() => onChange(v)}
                className={`${s.segBtn} ${value === v ? s.active : ''}`}>{label}</button>
      ))}
    </div>
  );
}

export function BlockEditor({ doc, onChange }: { doc: BlockDoc; onChange: (doc: BlockDoc) => void }) {
  const [menuAt, setMenuAt] = useState<number|null>(null);
  const [optsOpen, setOptsOpen] = useState<Record<string, boolean>>({});

  const blocks = doc.blocks;
  const set = (next: Block[]) => onChange({ version:1, blocks: next });

  const update = (id: string, data: Record<string, any>) =>
    set(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
  const remove = (id: string) => set(blocks.filter(b => b.id !== id));
  const duplicate = (i: number) =>
    set([...blocks.slice(0, i + 1), { ...emptyBlock(blocks[i].type), data: JSON.parse(JSON.stringify(blocks[i].data)) }, ...blocks.slice(i + 1)]);
  const move = (i: number, dir: -1|1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  const insert = (type: BlockType, at: number) => {
    set([...blocks.slice(0, at), emptyBlock(type), ...blocks.slice(at)]);
    setMenuAt(null);
  };

  return (
    <div>
      <div className={s.canvas}>
        {blocks.length === 0 && <div className={s.empty}>Nothing written yet — start with a block below.</div>}

        {blocks.map((block, i) => {
          const open = !!optsOpen[block.id];
          return (
            <div key={block.id}>
              {i > 0 && (
                menuAt === i
                  ? <Palette onPick={t => insert(t, i)} onClose={() => setMenuAt(null)} />
                  : <div className={s.gap}>
                      <div className={s.gapInner}>
                        <button className={s.gapBtn} onClick={() => setMenuAt(i)} title="Insert a block here"><IconPlus /></button>
                        <span className={s.gapLine} />
                      </div>
                    </div>
              )}

              <div className={s.block}>
                <span className={s.kind}>{BLOCK_LABEL[block.type] || block.type}</span>
                <div className={s.tools}>
                  {HAS_OPTIONS.has(block.type) && (
                    <button className={`${s.icon} ${open ? s.on : ''}`} title="Options"
                            onClick={() => setOptsOpen(p => ({ ...p, [block.id]: !open }))}><IconSliders /></button>
                  )}
                  <button className={s.icon} title="Move up" disabled={i === 0} onClick={() => move(i, -1)}><IconUp /></button>
                  <button className={s.icon} title="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}><IconDown /></button>
                  <button className={s.icon} title="Duplicate" onClick={() => duplicate(i)}><IconCopy /></button>
                  <button className={`${s.icon} ${s.danger}`} title="Delete" onClick={() => remove(block.id)}><IconTrash /></button>
                </div>

                <BlockBody block={block} update={d => update(block.id, d)} showOptions={open} />
              </div>
            </div>
          );
        })}

        <div className={s.addBar}>
          {COMMON.map(t => (
            <button key={t} className={s.addBtn} onClick={() => insert(t, blocks.length)}>
              <IconPlus />{BLOCK_LABEL[t]}
            </button>
          ))}
          <button className={`${s.addBtn} ${s.subtle}`} onClick={() => setMenuAt(menuAt === -1 ? null : -1)}>More…</button>
        </div>
        {menuAt === -1 && <Palette onPick={t => insert(t, blocks.length)} onClose={() => setMenuAt(null)} />}
      </div>
    </div>
  );
}

function Palette({ onPick, onClose }: { onPick: (t: BlockType) => void; onClose: () => void }) {
  return (
    <div className={s.palette}>
      <div className={s.paletteHead}>
        <span>Insert a block</span>
        <button className={s.segBtn} onClick={onClose}>Cancel</button>
      </div>
      <div className={s.paletteGrid}>
        {BLOCK_MENU.map(m => (
          <button key={m.type} className={s.paletteItem} onClick={() => onPick(m.type)}>
            <div className={s.paletteName}>{m.label}</div>
            <div className={s.paletteHint}>{m.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Small diagram of picture-and-text for each image layout. */
function LayoutGlyph({ id }: { id:string }) {
  const Line = ({ x, y, w }: { x:number; y:number; w:number }) =>
    <rect x={x} y={y} width={w} height={2} rx={1} fill="currentColor" opacity=".38" />;
  const Pic = (p: { x:number; y:number; w:number; h:number }) =>
    <rect {...p} rx={2} fill="currentColor" opacity=".82" />;
  return (
    <svg width="46" height="30" viewBox="0 0 46 30" aria-hidden style={{ display:'block' }}>
      {id === 'full' && <><Pic x={0} y={0} w={46} h={15} /><Line x={0} y={20} w={46} /><Line x={0} y={25} w={32} /></>}
      {id === 'inset' && <><Pic x={10} y={0} w={26} h={15} /><Line x={0} y={20} w={46} /><Line x={0} y={25} w={32} /></>}
      {id === 'left' && <><Pic x={0} y={0} w={19} h={19} /><Line x={23} y={1} w={23} /><Line x={23} y={6} w={23} /><Line x={23} y={11} w={23} /><Line x={23} y={16} w={15} /><Line x={0} y={24} w={46} /></>}
      {id === 'right' && <><Pic x={27} y={0} w={19} h={19} /><Line x={0} y={1} w={23} /><Line x={0} y={6} w={23} /><Line x={0} y={11} w={23} /><Line x={0} y={16} w={15} /><Line x={0} y={24} w={46} /></>}
    </svg>
  );
}

function BlockBody({ block, update, showOptions }: { block: Block; update: (d: Record<string, any>) => void; showOptions: boolean }) {
  const d = block.data || {};
  const opts = (children: React.ReactNode) => showOptions ? <div className={s.options}>{children}</div> : null;

  switch (block.type) {
    case 'text':
      return <Auto value={d.text || ''} onChange={text => update({ text })} className={s.text}
                   placeholder={`Write here — a blank line starts a new paragraph.   ${HINT}`} min={3} />;

    case 'heading':
      return (
        <>
          <Auto value={d.text || ''} onChange={text => update({ text })}
                className={d.level === 3 ? s.h3 : s.h2} placeholder="Section heading" min={1} />
          {opts(
            <Opt label="Level">
              <Seg options={[[2, 'Section'], [3, 'Sub-section']]} value={d.level || 2} onChange={level => update({ level })} />
            </Opt>
          )}
        </>
      );

    case 'image': {
      const current = imageLayoutId(d);
      return (
        <>
          <ImageField label="" url={d.url || ''} onChange={url => update({ url })} />
          <div style={{ marginTop:16 }}>
            <div className={s.optLabel}>How it sits in the article</div>
            <div className={s.layouts}>
              {IMAGE_LAYOUTS.map(l => (
                <button key={l.id} title={l.label} onClick={() => update({ ...l.data })}
                        className={`${s.layout} ${current === l.id ? s.active : ''}`}>
                  <LayoutGlyph id={l.id} />
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {opts(
            <>
              <Opt label={`Size — ${imageWidth(d.width)}% of the column`}>
                <input type="range" className={s.range} min={20} max={100} step={5}
                       value={imageWidth(d.width)} onChange={e => update({ width: Number(e.target.value) })} />
              </Opt>
              <Opt label="Caption"><input className={s.input} value={d.caption || ''} onChange={e => update({ caption: e.target.value })} /></Opt>
              <Opt label="Alt text — read aloud by screen readers"><input className={s.input} value={d.alt || ''} onChange={e => update({ alt: e.target.value })} /></Opt>
            </>
          )}
        </>
      );
    }

    case 'imageText':
      return (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:18, alignItems:'start' }}>
            <ImageField label="" url={d.url || ''} onChange={url => update({ url })} />
            <Auto value={d.text || ''} onChange={text => update({ text })} className={s.small} placeholder="Text beside the image" min={4} />
          </div>
          {opts(
            <>
              <Opt label="Layout"><Seg options={[['left', 'Image left'], ['right', 'Image right']]} value={d.side || 'left'} onChange={side => update({ side })} /></Opt>
              <Opt label="Alt text"><input className={s.input} value={d.alt || ''} onChange={e => update({ alt: e.target.value })} /></Opt>
            </>
          )}
        </>
      );

    case 'gallery': {
      const images: any[] = d.images || [];
      const setImages = (next: any[]) => update({ images: next });
      return (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {images.map((img, i) => (
              <div key={i} className={s.row} style={{ display:'grid', gap:6 }}>
                <ImageField label="" url={img.url || ''} onChange={url => setImages(images.map((x, j) => j === i ? { ...x, url } : x))} />
                <button className={s.segBtn} onClick={() => setImages(images.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
            <button className={s.addBtn} style={{ minHeight:76, justifyContent:'center' }}
                    onClick={() => setImages([...images, { url:'', alt:'', caption:'' }])}><IconPlus />Image</button>
          </div>
          {opts(<Opt label="Columns"><Seg options={[[2, '2'], [3, '3'], [4, '4']]} value={d.columns || 3} onChange={columns => update({ columns })} /></Opt>)}
        </>
      );
    }

    case 'quote':
      return (
        <>
          <Auto value={d.text || ''} onChange={text => update({ text })} className={s.quote} placeholder="The line worth pulling out" min={2} />
          {opts(<Opt label="Attribution"><input className={s.input} value={d.attribution || ''} onChange={e => update({ attribution: e.target.value })} /></Opt>)}
        </>
      );

    case 'callout':
      return (
        <>
          <Auto value={d.text || ''} onChange={text => update({ text })} className={s.small} placeholder="A note worth setting apart" min={3} />
          {opts(<Opt label="Tone"><Seg options={[['accent', 'Accent'], ['muted', 'Muted']]} value={d.tone || 'accent'} onChange={tone => update({ tone })} /></Opt>)}
        </>
      );

    case 'list': {
      const items: string[] = d.items || [];
      const setItems = (next: string[]) => update({ items: next });
      return (
        <>
          <div style={{ display:'grid', gap:4 }}>
            {items.map((item, i) => (
              <div key={i} className={s.row}>
                <span className={s.rowMark}>{d.ordered ? `${i + 1}.` : '—'}</span>
                <Auto value={item} onChange={v => setItems(items.map((x, j) => j === i ? v : x))} className={s.small} placeholder="List item" min={1} />
                <button className={s.rowKill} title="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}><IconTrash /></button>
              </div>
            ))}
          </div>
          <button className={s.addBtn} style={{ marginTop:10 }} onClick={() => setItems([...items, ''])}><IconPlus />Item</button>
          {opts(<Opt label="Style"><Seg options={[[false, 'Bulleted'], [true, 'Numbered']]} value={!!d.ordered} onChange={ordered => update({ ordered })} /></Opt>)}
        </>
      );
    }

    case 'annotation':
      return (
        <div style={{ display:'grid', gap:8 }}>
          <input className={`${s.input} ${s.mono}`} value={d.signature || ''} onChange={e => update({ signature: e.target.value })}
                 placeholder='@Programmer(focus = "syntax", goal = "make it work")' />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 170px', gap:8 }}>
            <input className={s.input} value={d.title || ''} onChange={e => update({ title: e.target.value })} placeholder="Learns the how" />
            <input className={s.input} value={d.depth || ''} onChange={e => update({ depth: e.target.value })} placeholder="Depth 1 / 3" />
          </div>
          <input className={s.input} value={d.ask || ''} onChange={e => update({ ask: e.target.value })} placeholder='asks: "what do I write here?"' />
        </div>
      );

    case 'comparison': {
      const rows: any[] = d.rows || [];
      const setRows = (next: any[]) => update({ rows: next });
      return (
        <div style={{ display:'grid', gap:12 }}>
          {rows.map((row, i) => (
            <div key={i} className={s.row}>
              <input className={`${s.input} ${s.mono}`} style={{ width:190, flexShrink:0 }} value={row.label || ''} placeholder="@Programmer"
                     onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <Auto value={row.text || ''} className={s.small} placeholder="What this row says" min={2}
                    onChange={v => setRows(rows.map((x, j) => j === i ? { ...x, text: v } : x))} />
              <button className={s.rowKill} title="Remove" onClick={() => setRows(rows.filter((_, j) => j !== i))}><IconTrash /></button>
            </div>
          ))}
          <button className={s.addBtn} style={{ justifySelf:'start' }} onClick={() => setRows([...rows, { label:'', text:'' }])}><IconPlus />Row</button>
        </div>
      );
    }

    case 'code':
      return <Auto value={d.code || ''} onChange={code => update({ code })} className={s.code} placeholder="Paste code" min={4} />;

    case 'divider':
      return <div className={s.divider} />;

    case 'html':
      return <Auto value={d.html || ''} onChange={html => update({ html })} className={s.code} placeholder="<div>…</div>" min={4} />;

    default:
      return null;
  }
}
