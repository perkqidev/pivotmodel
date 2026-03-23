import type { Metadata } from 'next';
import './globals.css';
import RevealObserver from '@/components/RevealObserver';

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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
