import type { Metadata } from 'next';
import './globals.css';
import './aero-tokens.css';
import RevealObserver from '@/components/RevealObserver';
import { ToastProvider } from '@/components/shared/Toast/ToastProvider';

export const metadata: Metadata = {
  title: 'The Pivot Model — Engineering Excellence for the Age of AI',
  description: 'A battle-tested framework for offshore engineering excellence. Four pivots. Three maturity levels. One transformation.',
  openGraph: {
    title: 'The Pivot Model',
    description: 'Engineering Excellence for Offshore Teams',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <RevealObserver />
        </ToastProvider>
      </body>
    </html>
  );
}
