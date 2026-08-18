'use client';
import { Block, imageAlign, imageWidth, inlineHtml, paragraphsHtml } from '@/lib/blog/blocks';

/**
 * Renders a post's blocks. Used by the member-facing reader and by the admin
 * preview, so the preview is the real thing rather than an approximation.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return <div className="post-body">{blocks.map(b => <BlockView key={b.id} block={b} />)}</div>;
}

function BlockView({ block }: { block: Block }) {
  const d = block.data || {};

  switch (block.type) {
    case 'text':
      return <div dangerouslySetInnerHTML={{ __html: paragraphsHtml(d.text) }} />;

    case 'heading':
      return d.level === 3
        ? <h3 dangerouslySetInnerHTML={{ __html: inlineHtml(d.text) }} />
        : <h2 dangerouslySetInnerHTML={{ __html: inlineHtml(d.text) }} />;

    case 'image': {
      if (!d.url) return null;
      const wrap = d.wrap === 'left' || d.wrap === 'right' ? d.wrap : null;
      return (
        <figure
          className={wrap ? `post-fig post-fig-wrap-${wrap}` : 'post-fig'}
          style={{ maxWidth: `${imageWidth(d.width)}%`, ...(wrap ? {} : imageAlign(d.align)) }}
        >
          <img src={d.url} alt={d.alt || ''} />
          {d.caption && <figcaption>{d.caption}</figcaption>}
        </figure>
      );
    }

    case 'imageText':
      return (
        <div className={`post-split${d.side === 'right' ? ' post-split-right' : ''}`}>
          {d.url && (
            <figure className="post-split-media">
              <img src={d.url} alt={d.alt || ''} />
              {d.caption && <figcaption>{d.caption}</figcaption>}
            </figure>
          )}
          <div className="post-split-text" dangerouslySetInnerHTML={{ __html: paragraphsHtml(d.text) }} />
        </div>
      );

    case 'gallery': {
      const images = (d.images || []).filter((i: any) => i?.url);
      if (images.length === 0) return null;
      return (
        <div className="post-gallery" style={{ gridTemplateColumns: `repeat(${d.columns || images.length}, 1fr)` }}>
          {images.map((img: any, i: number) => (
            <figure key={i}>
              <img src={img.url} alt={img.alt || ''} />
              {img.caption && <figcaption>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    }

    case 'quote':
      return (
        <blockquote>
          <span dangerouslySetInnerHTML={{ __html: inlineHtml(d.text) }} />
          {d.attribution && <cite className="post-quote-by">{d.attribution}</cite>}
        </blockquote>
      );

    case 'callout':
      return (
        <div className={`post-callout${d.tone === 'muted' ? ' post-callout-muted' : ''}`}
             dangerouslySetInnerHTML={{ __html: paragraphsHtml(d.text) }} />
      );

    case 'list': {
      const items = (d.items || []).filter((i: string) => (i || '').trim());
      if (items.length === 0) return null;
      const li = items.map((item: string, i: number) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(item) }} />
      ));
      return d.ordered ? <ol>{li}</ol> : <ul>{li}</ul>;
    }

    case 'annotation':
      return (
        <div className="post-ann">
          {d.signature && <div className="post-ann-sig">{d.signature}</div>}
          <div className="post-ann-row">
            {d.title && <span className="post-ann-title">{d.title}</span>}
            {d.depth && <span className="post-ann-depth">{d.depth}</span>}
          </div>
          {d.ask && <p className="post-ann-ask" dangerouslySetInnerHTML={{ __html: inlineHtml(d.ask) }} />}
        </div>
      );

    case 'comparison': {
      const rows = (d.rows || []).filter((r: any) => (r?.label || r?.text));
      if (rows.length === 0) return null;
      return (
        <div className="post-takes">
          {rows.map((row: any, i: number) => (
            <div className="post-take" key={i}>
              {row.label && <div className="post-take-who">{row.label}</div>}
              <div dangerouslySetInnerHTML={{ __html: paragraphsHtml(row.text) }} />
            </div>
          ))}
        </div>
      );
    }

    case 'code':
      return (
        <pre className="post-code"><code>{d.code}</code></pre>
      );

    case 'divider':
      return <hr />;

    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: d.html || '' }} />;

    default:
      return null;
  }
}
