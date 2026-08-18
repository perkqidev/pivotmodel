/**
 * Blog post bodies are stored as a JSON document of blocks. Each block has a
 * type and its own fields, which is what lets one post be image-led, the next
 * a plain essay, and the next built from comparison cards.
 *
 * Older posts were stored as raw HTML or plain text. parseBody() folds those
 * into a single `html` block so nothing written before this existed is lost.
 */

import type { CSSProperties } from 'react';

export type BlockType =
  | 'text' | 'heading' | 'image' | 'imageText' | 'gallery' | 'quote'
  | 'callout' | 'list' | 'annotation' | 'comparison' | 'code' | 'divider' | 'html';

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

export interface BlockDoc {
  version: 1;
  blocks: Block[];
}

/** Shown in the "+ Add block" palette, in this order. */
export const BLOCK_MENU: { type: BlockType; label: string; hint: string }[] = [
  { type: 'text',       label: 'Text',           hint: 'Paragraphs' },
  { type: 'heading',    label: 'Heading',        hint: 'Section title' },
  { type: 'image',      label: 'Image',          hint: 'Full width, with caption' },
  { type: 'imageText',  label: 'Image + text',   hint: 'Side by side' },
  { type: 'gallery',    label: 'Gallery',        hint: 'Row of images' },
  { type: 'quote',      label: 'Quote',          hint: 'Pull quote' },
  { type: 'callout',    label: 'Callout',        hint: 'Highlighted note' },
  { type: 'list',       label: 'List',           hint: 'Bulleted or numbered' },
  { type: 'annotation', label: 'Annotation card',hint: 'Signature + title + label' },
  { type: 'comparison', label: 'Comparison',     hint: 'Labelled rows' },
  { type: 'code',       label: 'Code',           hint: 'Monospace block' },
  { type: 'divider',    label: 'Divider',        hint: 'Horizontal rule' },
  { type: 'html',       label: 'Custom HTML',    hint: 'Anything else' },
];

export const BLOCK_LABEL: Record<BlockType, string> =
  BLOCK_MENU.reduce((acc, b) => ({ ...acc, [b.type]: b.label }), {} as Record<BlockType, string>);

let idCounter = 0;
/** Block ids only need to be unique within one document (React keys, reorder). */
export function newBlockId() {
  idCounter += 1;
  return `b${idCounter}-${Math.floor(performance.now() * 1000).toString(36)}`;
}

export function emptyBlock(type: BlockType): Block {
  const data: Record<string, any> = {
    text:       { text: '' },
    heading:    { text: '', level: 2 },
    image:      { url: '', alt: '', caption: '', width: 100, align: 'center', wrap: 'none' },
    imageText:  { url: '', alt: '', text: '', side: 'left' },
    gallery:    { images: [], columns: 3 },
    quote:      { text: '', attribution: '' },
    callout:    { text: '', tone: 'accent' },
    list:       { items: [''], ordered: false },
    annotation: { signature: '', title: '', depth: '', ask: '' },
    comparison: { rows: [{ label: '', text: '' }] },
    code:       { code: '', language: '' },
    divider:    {},
    html:       { html: '' },
  }[type] ?? {};
  return { id: newBlockId(), type, data };
}

export function emptyDoc(): BlockDoc {
  return { version: 1, blocks: [] };
}

/** Accepts a block document, legacy HTML, legacy plain text, or nothing. */
export function parseBody(body: string | null | undefined): BlockDoc {
  const text = (body || '').trim();
  if (!text) return emptyDoc();
  if (text.startsWith('{')) {
    try {
      const doc = JSON.parse(text);
      if (Array.isArray(doc?.blocks)) {
        return {
          version: 1,
          blocks: doc.blocks
            .filter((b: any) => b && typeof b.type === 'string')
            .map((b: any) => ({ id: b.id || newBlockId(), type: b.type, data: b.data || {} })),
        };
      }
    } catch {
      // Not a block document — fall through and keep it as raw content.
    }
  }
  const isHtml = /<(p|h[1-6]|ul|ol|div|section|figure|blockquote|img|hr)\b/i.test(text);
  return {
    version: 1,
    blocks: [isHtml ? { id: newBlockId(), type: 'html', data: { html: text } }
                    : { id: newBlockId(), type: 'text', data: { text } }],
  };
}

export function serializeBody(doc: BlockDoc): string {
  return JSON.stringify({ version: 1, blocks: doc.blocks });
}

/**
 * Image width as a percentage of the column. Accepts the old 'full' / 'inset'
 * strings so posts written before the slider existed keep their layout.
 */
export function imageWidth(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.min(100, Math.max(20, Math.round(value)));
  if (value === 'inset') return 78;
  return 100;
}

/** Margins that place a resized image left, centre or right in the column. */
export function imageAlign(align: unknown): CSSProperties {
  if (align === 'left') return { marginLeft: 0, marginRight: 'auto' };
  if (align === 'right') return { marginLeft: 'auto', marginRight: 0 };
  return { marginLeft: 'auto', marginRight: 'auto' };
}

/**
 * The four ways an image can sit in an article. "Wrap" floats the image so the
 * paragraphs that follow it flow around the side — which is what people mean by
 * putting a picture inline with the text about it.
 */
export const IMAGE_LAYOUTS = [
  { id: 'full',  label: 'Full width', data: { width: 100, align: 'center', wrap: 'none'  } },
  { id: 'inset', label: 'Centred',    data: { width: 70,  align: 'center', wrap: 'none'  } },
  { id: 'left',  label: 'Wrap left',  data: { width: 45,  align: 'left',   wrap: 'left'  } },
  { id: 'right', label: 'Wrap right', data: { width: 45,  align: 'right',  wrap: 'right' } },
] as const;

/** Which preset an image block currently matches, for highlighting the button. */
export function imageLayoutId(data: Record<string, any>): string {
  if (data?.wrap === 'left') return 'left';
  if (data?.wrap === 'right') return 'right';
  return imageWidth(data?.width) >= 90 ? 'full' : 'inset';
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Inline formatting inside text fields, so writers get bold, italics, links
 * and inline code without a rich text editor: **bold**, *italic*, `code`,
 * [label](url). Everything is escaped first, so no markup can leak through.
 */
export function inlineHtml(raw: string) {
  return escapeHtml(raw || '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/** A text block holds several paragraphs, separated by blank lines. */
export function paragraphsHtml(raw: string) {
  return (raw || '')
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(p => `<p>${inlineHtml(p.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

/** Rough read time, so the field fills itself in instead of being guessed. */
export function estimateReadTime(doc: BlockDoc): number {
  const words = doc.blocks.reduce((n, b) => {
    const d = b.data || {};
    const parts = [d.text, d.html, d.code, d.ask, d.title, d.signature, d.attribution,
      ...(Array.isArray(d.items) ? d.items : []),
      ...(Array.isArray(d.rows) ? d.rows.flatMap((r: any) => [r.label, r.text]) : []),
    ].filter(Boolean) as string[];
    return n + parts.join(' ').split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
}
