'use client';
import { useRef } from 'react';
import styles from './Hero.module.css';
import { useHero } from './useHero';
import { BookCover } from '@/components/shared/BookCover/BookCover';
import { WaveCanvas } from '@/components/shared/WaveCanvas/WaveCanvas';

interface Props {
  theme: 'light' | 'dark';
}

export function Hero({ theme }: Props) {
  const { shown } = useHero();
  const hostRef = useRef<HTMLElement>(null);

  return (
    <header ref={hostRef} className={styles.hero}>
      <WaveCanvas hostRef={hostRef} theme={theme} />
      <div className={styles.veil} />

      <div className={styles.inner}>
        <div className={styles.kicker} data-shown={shown}>
          <span className={styles.kickerLine} />
          <span className={styles.label}>Engineering excellence · for the age of AI</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleLine} data-shown={shown}>
            <span>The Pivot</span>
          </span>
          <span className={styles.titleLine} data-shown={shown} style={{ transitionDelay: '0.12s' }}>
            <span><em>Model</em></span>
          </span>
        </h1>

        <p className={styles.desc} data-shown={shown}>
          A battle-tested framework for offshore engineering teams that don&apos;t just cut costs — they
          become a strategic advantage.
        </p>

        <div className={styles.actions} data-shown={shown}>
          <a href="/community" className={styles.btnPrimary}>Get access</a>
          <a href="#framework" className={styles.btnGhost}>
            The framework <span className={styles.ar}>→</span>
          </a>
        </div>
      </div>

      <div className={styles.scrollcue} data-shown={shown}>
        <span>Scroll</span>
        <span className={styles.scrollcueLine} />
      </div>

      <BookCover />
    </header>
  );
}
