'use client';
import { CSSProperties, ReactNode } from 'react';
import styles from './Reveal.module.css';
import { useReveal } from './useReveal';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({ children, delay = 0, as: Tag = 'div', className, style }: RevealProps) {
  const ref = useReveal();
  const mergedStyle: CSSProperties = delay ? { transitionDelay: `${delay}ms`, ...style } : (style ?? {});
  const TagAny = Tag as React.ElementType;
  return (
    <TagAny
      ref={ref}
      className={[styles.rv, className].filter(Boolean).join(' ')}
      style={mergedStyle}
    >
      {children}
    </TagAny>
  );
}
