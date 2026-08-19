'use client';
import s from './PostDetails.module.css';
import { ImageField } from './MediaPicker';

export interface PostMeta {
  title?: string;
  category?: string;
  excerpt?: string;
  hero_image?: string;
  hero_caption?: string;
  emoji?: string;
  read_time?: string | number;
  status?: string;
  on_pivotrics?: boolean;
}

function rowsFor(text: string, width: number, min = 1) {
  return Math.max(min, (text || '').split('\n').reduce((n, line) => n + 1 + Math.floor(line.length / width), 0));
}

/**
 * Shared by /admin and the local preview route so the two can't drift.
 * `onChange` receives a patch, not the whole object.
 */
export function PostDetails({ value, onChange, readTimeHint }: {
  value: PostMeta;
  onChange: (patch: PostMeta) => void;
  readTimeHint?: number;
}) {
  return (
    <div className={s.panel}>
      <textarea
        className={s.title}
        value={value.title || ''}
        placeholder="Post title"
        rows={rowsFor(value.title || '', 34)}
        onChange={e => onChange({ title: e.target.value })}
      />
      <textarea
        className={s.excerpt}
        value={value.excerpt || ''}
        placeholder="A sentence or two of summary — this is what shows on the card in Insights."
        rows={rowsFor(value.excerpt || '', 78, 2)}
        onChange={e => onChange({ excerpt: e.target.value })}
      />

      <div className={s.rule} />

      <div className={s.split}>
        <div>
          <div className={s.grid}>
            <div>
              <div className={s.label}>Category</div>
              <input className={s.input} value={value.category || ''} placeholder="Engineering Craft"
                     onChange={e => onChange({ category: e.target.value })} />
            </div>
            <div>
              <div className={s.label}>Emoji</div>
              <input className={s.input} value={value.emoji || ''}
                     onChange={e => onChange({ emoji: e.target.value })} />
            </div>
            <div>
              <div className={s.label}>Read time</div>
              <input className={s.input} value={value.read_time ?? ''}
                     placeholder={readTimeHint ? `${readTimeHint} min` : 'auto'}
                     onChange={e => onChange({ read_time: e.target.value })} />
            </div>
          </div>

          <div className={s.label}>Visibility</div>
          <div className={s.seg}>
            {[
              { id: 'draft', label: 'Draft', note: 'Only you can see it' },
              { id: 'published', label: 'Published', note: 'Live for members' },
            ].map(o => (
              <button key={o.id} onClick={() => onChange({ status: o.id })}
                      className={`${s.segBtn} ${(value.status || 'draft') === o.id ? s.active : ''}`}>
                {o.label}
                <span className={s.segNote}>{o.note}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={!!value.on_pivotrics}
            disabled={value.status !== 'published'}
            onClick={() => onChange({ on_pivotrics: !value.on_pivotrics })}
            className={`${s.switchRow} ${value.on_pivotrics ? s.on : ''}`}
          >
            <span className={s.switch} />
            <span className={s.switchText}>
              Also show on Pivotrics
              <span className={s.switchNote}>
                {value.status === 'published'
                  ? 'Off means this post stays on The Pivot Model only.'
                  : 'Available once the post is published.'}
              </span>
            </span>
          </button>
        </div>

        <div>
          <ImageField label="Hero image" url={value.hero_image || ''} onChange={url => onChange({ hero_image: url })} />
          {value.hero_image && (
            <div style={{ marginTop: 12 }}>
              <div className={s.label}>Description</div>
              <input className={s.input} value={value.hero_caption || ''}
                     placeholder="Caption shown under the image"
                     onChange={e => onChange({ hero_caption: e.target.value })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
