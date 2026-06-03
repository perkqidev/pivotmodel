'use client';
import { useEffect, useRef } from 'react';
import styles from './BookCover.module.css';
import { useBookCover } from './useBookCover';

/** 3D openable book cover. Drifts gently, tilts to the cursor, and the
 *  cover swings open on hover to reveal an inside page. */
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
          <div className={styles.inside}>
            <div className={styles.imk}>◆</div>
            <div className={styles.ittl}>Four Pivots.<br />Three Levels.</div>
            <div className={styles.iln} />
            <p>Operational Excellence<br />Pace of Evolution<br />Alignment · Results</p>
            <div className={styles.icta}>Open the framework →</div>
          </div>
          <div className={styles.cover}>
            <div className={`${styles.face} ${styles.front}`}>
              <div className={styles.top}>A Framework for Offshore<br />Engineering Excellence</div>
              <div className={styles.mid}>
                <div className={styles.mark}>◆</div>
                <div className={styles.title}>THE<br />PIVOT<br /><strong>MODEL</strong></div>
                <div className={styles.rule} />
                <div className={styles.sub}>Four Pivots · Three Levels<br />One Transformation</div>
              </div>
              <div className={styles.bot}>A Field Guide for Engineering Leaders</div>
            </div>
            <div className={`${styles.face} ${styles.back}`} />
          </div>
          <div className={styles.spine} />
          <div className={styles.hint}>Hover to open ↗</div>
        </div>
      </div>
    </div>
  );
}
