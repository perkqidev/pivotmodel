'use client';

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving?: boolean;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error: '!',
  info: 'i',
};

const AUTO_DISMISS_MS = 3200;
const LEAVE_ANIM_MS = 240;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, LEAVE_ANIM_MS);
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    if (!message) return;
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => remove(id), AUTO_DISMISS_MS);
  }, [remove]);

  const value: ToastContextValue = {
    show,
    success: msg => show(msg, 'success'),
    error:   msg => show(msg, 'error'),
    info:    msg => show(msg, 'info'),
  };

  const host = (
    <div className={styles.host} aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div
          key={t.id}
          className={styles.toast}
          data-variant={t.variant}
          data-leaving={t.leaving ? 'true' : undefined}
          role={t.variant === 'error' ? 'alert' : 'status'}
        >
          <span className={styles.icon}>{ICONS[t.variant]}</span>
          <span className={styles.body}>{t.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => remove(t.id)}
            aria-label="Dismiss"
          >×</button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && createPortal(host, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback: no-op so a missing provider never crashes.
    return {
      show:    () => {},
      success: () => {},
      error:   () => {},
      info:    () => {},
    };
  }
  return ctx;
}
