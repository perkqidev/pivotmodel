'use client';
import { RefObject, useRef } from 'react';
import styles from './WaveCanvas.module.css';
import { useWaveCanvas } from './useWaveCanvas';

interface Props {
  hostRef: RefObject<HTMLElement>;
  theme: 'light' | 'dark';
}

/** Renders the Three.js particle-wave inside the host (e.g. the hero section).
 *  The canvas is absolutely positioned and sized to the host. */
export function WaveCanvas({ hostRef, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useWaveCanvas(canvasRef, hostRef, { theme });
  return <canvas ref={canvasRef} className={styles.gl} aria-hidden />;
}
