import { query } from '@/lib/db';
import LandingClient from '@/components/landing/LandingClient';
import ConsultModal from '@/components/ConsultModal';

interface BlogPost {
  id: number; title: string; category: string; excerpt: string;
  emoji: string; read_time: number; published_at: string;
}
interface Whitepaper {
  id: number; title: string; category: string;
  icon: string; pages: number; access: string;
}

async function getInsights(): Promise<{ posts: BlogPost[]; papers: Whitepaper[] }> {
  try {
    const posts = await query<BlogPost>(
      `SELECT id, title, category, excerpt, emoji, read_time, published_at
       FROM blog_posts WHERE status = 'published'
       ORDER BY published_at DESC LIMIT 3`
    );
    const papers = await query<Whitepaper>(
      `SELECT id, title, category, icon, pages, access
       FROM whitepapers ORDER BY created_at DESC LIMIT 4`
    );
    return { posts, papers };
  } catch {
    return { posts: [], papers: [] };
  }
}

export default async function HomePage() {
  const { posts, papers } = await getInsights();
  return (
    <>
      <LandingClient posts={posts} papers={papers} />
      <ConsultModal source="landing_page" />
    </>
  );
}
