import type { CSSProperties } from 'react';

type IconName =
  | 'home' | 'clipboard' | 'layers' | 'pen' | 'file' | 'briefcase'
  | 'user' | 'shield' | 'logout' | 'sun' | 'moon' | 'chevron'
  | 'grid' | 'trash' | 'search' | 'arrow-right' | 'arrow-left'
  | 'plus' | 'check' | 'close' | 'message';

/* Minimal line-icons (Lucide-style). Stroke inherits currentColor so they
   stay monochrome and match surrounding text — no colourful emoji. */
const PATHS: Record<IconName, JSX.Element> = {
  home: <><path d="M3 9.5 12 3l9 6.5" /><path d="M5 8.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5" /></>,
  clipboard: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="m9 13 2 2 4-4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  pen: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  file: <><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M9 13h6M9 17h4" /></>,
  briefcase: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  shield: <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6z" />,
  logout: <><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  'arrow-right': <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  'arrow-left': <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  check: <path d="m5 12 5 5L20 7" />,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  message: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />,
};

export default function Icon({
  name, size = 18, stroke = 1.7, style,
}: { name: IconName; size?: number; stroke?: number; style?: CSSProperties }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }} aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
