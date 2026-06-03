'use client';

import { useEffect } from 'react';
import { useTheme } from '@/components/shared/ThemeToggle/useTheme';
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle';
import { Cursor } from '@/components/shared/Cursor/Cursor';

import { Nav } from '@/components/landing/Nav/Nav';
import { Hero } from '@/components/landing/Hero/Hero';
import { Stats } from '@/components/landing/Stats/Stats';
import { About } from '@/components/landing/About/About';
import { Audience } from '@/components/landing/Audience/Audience';
import { AIAge } from '@/components/landing/AIAge/AIAge';
import { Pivots } from '@/components/landing/Pivots/Pivots';
import { Ladder } from '@/components/landing/Ladder/Ladder';
import { Materials } from '@/components/landing/Materials/Materials';
import { Insights } from '@/components/landing/Insights/Insights';
import { Author } from '@/components/landing/Author/Author';
import { Consulting } from '@/components/landing/Consulting/Consulting';
import { FinalCTA } from '@/components/landing/FinalCTA/FinalCTA';
import { Footer } from '@/components/landing/Footer/Footer';

interface BlogPost {
  id: number; title: string; category: string; excerpt: string;
  emoji: string; read_time: number; published_at: string;
}
interface Whitepaper {
  id: number; title: string; category: string;
  icon: string; pages: number; access: string;
}

interface Props {
  posts: BlogPost[];
  papers: Whitepaper[];
}

export default function LandingClient({ posts, papers }: Props) {
  const { theme, toggle } = useTheme();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  return (
    <div className="landing-aero" data-theme={theme}>
      <Cursor />
      <Nav />
      <div className="landing-aero-toggle">
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>

      <Hero theme={theme} />
      <Stats />
      <About theme={theme} />
      <Audience theme={theme} />
      <AIAge />
      <Pivots theme={theme} />
      <Ladder theme={theme} />
      <Materials theme={theme} />
      <Insights posts={posts} papers={papers} />
      <Author />
      <Consulting />
      <FinalCTA />
      <Footer />
    </div>
  );
}
