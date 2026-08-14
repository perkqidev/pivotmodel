'use client';
import { useEffect, useRef } from 'react';
import styles from './BookCover.module.css';
import { useBookCover } from './useBookCover';

/** 3D book cover. Drifts gently and tilts to the cursor. */
export function BookCover() {
  const bookRef = useBookCover();
  const driftRef = useRef<HTMLDivElement>(null);

  // Reveal the drift element shortly after mount.
  useEffect(() => {
    const el = driftRef.current;
    if (!el) return;
    const t = setTimeout(() => { el.dataset.shown = 'true'; }, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={driftRef} className={styles.drift} aria-hidden>
      <div className={styles.scene}>
        <div ref={bookRef} className={styles.book}>
          <div className={styles.cover}>
            <div className={`${styles.face} ${styles.front}`}>
              <img src="/book-cover.png" alt="The Pivot Model" className={styles.coverImg} />
            </div>
          </div>
          <div className={styles.spine} />
        </div>
      </div>
    </div>
  );
}
