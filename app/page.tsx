import { query } from '@/lib/db';
import Nav from '@/components/Nav';
import HeroSection from '@/components/HeroSection';
import StatsBand from '@/components/StatsBand';
import ConsultingSection from '@/components/ConsultingSection';
import Footer from '@/components/Footer';
import ConsultModal from '@/components/ConsultModal';

async function getInsights() {
  try {
    const posts = await query<{
      id: number; title: string; category: string; excerpt: string;
      emoji: string; read_time: number; published_at: string;
    }>(`
      SELECT id, title, category, excerpt, emoji, read_time, published_at
      FROM blog_posts WHERE status = 'published'
      ORDER BY published_at DESC LIMIT 3
    `);

    const papers = await query<{
      id: number; title: string; category: string;
      icon: string; pages: number; access: string;
    }>(`
      SELECT id, title, category, icon, pages, access
      FROM whitepapers ORDER BY created_at DESC LIMIT 4
    `);

    return { posts, papers };
  } catch {
    return { posts: [], papers: [] };
  }
}

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 86400) return 'today';
  if (d < 30 * 86400) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default async function HomePage() {
  const { posts, papers } = await getInsights();

  return (
    <>
      <Nav />

      <HeroSection />

      <StatsBand />

      <section className="about" id="about">
        <div className="section-inner">
          <div className="about-text">
            <div className="section-label reveal">What This Book Is About</div>
            <h2 className="section-title reveal">
              Offshore teams fail for<br /><em>predictable</em> reasons.
            </h2>
            <div className="about-body reveal">
              <p>
                Most companies set up offshore engineering teams to cut costs — and end up with exactly what they paid for.
                The Pivot Model is a battle-tested framework that reframes the entire conversation: offshore teams aren&apos;t
                a compromise, they&apos;re a <strong>strategic advantage waiting to be unlocked.</strong>
              </p>
              <p>
                Built on over two decades of real-world experience building world-class product engineering operations
                across India, the US, and Europe, this book gives engineering leaders the vocabulary, structure, and
                practical tools to stop firefighting and start building something that lasts.
              </p>
            </div>
            <a href="/community" className="btn btn-primary reveal">Register &amp; Access Materials →</a>
          </div>
          <div className="about-callouts reveal">
            <div className="callout">
              <div className="callout-icon">⚙</div>
              <h3>For Engineering Leaders</h3>
              <p>CTOs, VPs of Engineering, and Product leaders building or optimizing offshore teams.</p>
            </div>
            <div className="callout">
              <div className="callout-icon">🌐</div>
              <h3>For Product Companies</h3>
              <p>Companies with engineering operations in India, Eastern Europe, or anywhere offsite.</p>
            </div>
            <div className="callout">
              <div className="callout-icon">📈</div>
              <h3>For Growth-Stage Orgs</h3>
              <p>Scaling teams that need rigour, repeatability, and results — not headcount alone.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ai-age" id="ai-age">
        <div className="section-inner">
          <div className="ai-age-inner">
            <div className="ai-age-left reveal">
              <div className="section-label">Why This Book Is Urgent Now</div>
              <h2 className="section-title">AI doesn&apos;t replace<br />engineering maturity.<br /><em>It demands it.</em></h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 16 }}>
                Every engineering team is under pressure to adopt AI tools, ship AI features, and compete with AI-native startups.
                But here&apos;s what nobody is saying clearly:{' '}
                <strong style={{ color: 'var(--cream)' }}>AI amplifies whatever your team already is.</strong>
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 32 }}>
                A mature, well-structured team becomes dramatically more productive. A fragmented, reactive team becomes faster
                at producing the wrong things. The Pivot Model gives you the foundation to make AI work <em>for</em> you — not against you.
              </p>
              <a href="/community" className="btn btn-primary">Get Access Now →</a>
            </div>
            <div className="ai-age-cards reveal">
              {[
                { num: 'Phase 1', title: 'AI-Augmented Traditional Development', body: 'Copilot, code review, documentation — the tools are here. Does your team have the engineering discipline to use them effectively?', status: 'now', label: 'Happening now' },
                { num: 'Phase 2', title: 'Traditional Products with AI Features', body: 'Your customers expect AI capabilities. Building them well requires product maturity, not just model APIs and good intentions.', status: 'active', label: 'Where most teams are heading' },
                { num: 'Phase 3', title: 'AI-Native Applications', body: 'New architectures, new talent profiles, new revenue models. The teams that reach this stage will have built the right foundations first.', status: 'future', label: 'The competitive frontier' },
              ].map(c => (
                <div className="ai-phase-card" key={c.num}>
                  <div className="ai-phase-num">{c.num}</div>
                  <h4>{c.title}</h4>
                  <p>{c.body}</p>
                  <div className={`ai-phase-status ${c.status}`}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="ai-truth-banner reveal">
            <div className="ai-truth-quote">&ldquo;The engineering teams that will thrive in the age of AI are not the ones with the best tools — they are the ones with the highest maturity.&rdquo;</div>
            <div className="ai-truth-attr">— The Pivot Model</div>
          </div>
        </div>
      </section>

      <section className="pivots" id="concepts">
        <div className="section-inner">
          <div className="section-label reveal" style={{ textAlign: 'center' }}>The Framework</div>
          <h2 className="section-title reveal" style={{ textAlign: 'center' }}>Four Pivots.<br />One Transformation.</h2>
          <p className="section-intro reveal" style={{ margin: '0 auto 48px', textAlign: 'center' }}>
            The Pivot Model organises offshore engineering maturity around four interconnected performance dimensions.
            Master them in sequence — or diagnose exactly where your team is struggling today.
          </p>
          <div className="pivots-grid">
            {[
              { num: '01', icon: '⚡', title: 'Operational Excellence', body: 'Predictable delivery, quality ownership, and engineering discipline — the non-negotiable foundation of any high-performance team.', tag: 'FOUNDATION' },
              { num: '02', icon: '🚀', title: 'Pace of Product Evolution', body: 'Speed matters. Learn how to build the capabilities that accelerate time-to-market without sacrificing quality or accumulating debt.', tag: 'VELOCITY' },
              { num: '03', icon: '🤝', title: 'Collaboration & Alignment', body: 'Bridging the distance — cultural, temporal, and organisational — between offshore teams and the business they serve.', tag: 'ALIGNMENT' },
              { num: '04', icon: '📊', title: 'Business Results', body: 'Engineering exists to drive outcomes, not output. Discover how to connect engineering KRAs directly to top-line business impact.', tag: 'IMPACT' },
            ].map(p => (
              <div className="pivot-card reveal" key={p.num}>
                <div className="pivot-num">{p.num}</div>
                <div className="pivot-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <div className="pivot-tag">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="maturity">
        <div className="section-inner">
          <div className="maturity-left reveal">
            <div className="section-label">The Maturity Ladder</div>
            <h2 className="section-title">Where is your team<br />on the journey?</h2>
            <p>The Pivot Model defines three engineering maturity levels — each with clear competency benchmarks, performance KRAs, and a concrete path forward. Stop guessing. Start measuring.</p>
            <a href="/community" className="btn btn-primary">Get the Full EMB Framework →</a>
          </div>
          <div className="maturity-levels reveal">
            {[
              { badge: 'L1', title: 'Execution Layer', body: 'Task-focused delivery. Dependent on direction. Building basic engineering habits.', active: false },
              { badge: 'L2', title: 'Engineering Ownership', body: 'Self-directed quality. Proactive communication. Beginning to shape the product.', active: false },
              { badge: 'L3', title: 'Strategic Partnership', body: 'Business-aware engineering. Thought leadership. Driving innovation from offshore.', active: true },
            ].map((l, i) => (
              <div key={l.badge}>
                {i > 0 && <div className="level-connector">↓</div>}
                <div className="level">
                  <div className={`level-badge${l.active ? ' active' : ''}`}>{l.badge}</div>
                  <div className="level-content">
                    <h4>{l.title}</h4>
                    <p>{l.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="materials-preview" id="materials">
        <div className="section-inner">
          <div className="section-label reveal" style={{ textAlign: 'center' }}>Community + Materials</div>
          <h2 className="section-title reveal" style={{ textAlign: 'center' }}>Join the Community.<br />Get the Full Toolkit.</h2>
          <p className="section-intro reveal" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
            Register free to unlock downloadable frameworks, templates, and a growing community of product engineering leaders tackling the same challenges you are.
          </p>
          <div className="materials-grid">
            {[
              { icon: '📋', title: 'EMB Schema Templates', body: 'Custom Engineering Maturity Benchmark worksheets — ready to adapt for your organisation.' },
              { icon: '📊', title: 'KRA & Performance Frameworks', body: 'Role-by-role Key Result Areas aligned to the Four Pivots, with scoring rubrics.' },
              { icon: '🗺️', title: 'Offshore Setup Playbooks', body: 'Captive unit vs third-party decision trees, engagement format guides, and onboarding frameworks.' },
              { icon: '🧪', title: 'Self-Assessment Tools', body: "Quick-score your team's maturity across all Four Pivots in under 20 minutes." },
              { icon: '🎯', title: 'AI Impact Guides', body: "Practical guides to navigating the three phases of AI's impact on engineering talent." },
              { icon: '📄', title: 'Whitepapers & Research', body: 'In-depth frameworks and research on offshore engineering excellence.' },
            ].map(m => (
              <div className="material-item reveal" key={m.title}>
                <div className="material-icon">{m.icon}</div>
                <h4>{m.title}</h4>
                <p>{m.body}</p>
                <div className="material-lock">🔒 Members only</div>
              </div>
            ))}
          </div>
          <div className="materials-cta reveal">
            <a href="/community" className="btn btn-primary btn-large">Register Free &amp; Unlock Everything</a>
            <p className="cta-note">No payment required. Just a passion for engineering excellence.</p>
          </div>
        </div>
      </section>

      <section className="author" id="author">
        <div className="section-inner author-inner">
          <div className="author-portrait reveal">
            <div className="portrait-frame">
              <div className="portrait-initials">PM</div>
            </div>
            <div className="author-quote">
              <em>&ldquo;Intuition-based engineering is injurious to software quality.&rdquo;</em>
            </div>
          </div>
          <div className="author-bio reveal">
            <div className="section-label">About the Author</div>
            <h2 className="section-title">25+ Years Building<br />World-Class Teams</h2>
            <p>The author&apos;s career spans some of the finest engineering environments across India and the global stage — from Verifone in the 1990s, widely considered one of India&apos;s premier product engineering cultures, to the Vista Equity Partners management ecosystem and numerous global engineering transformations.</p>
            <p>The Pivot Model is the distillation of those decades — a rigorous, practical framework for any leader who refuses to accept &ldquo;good enough&rdquo; from their offshore engineering operation.</p>
            <a href="/community" className="btn btn-outline">Connect in the Community →</a>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="noise-overlay" />
        <div className="section-inner" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="final-ornament">◆</div>
          <h2 className="reveal">Your team&apos;s AI future<br />starts with maturity.</h2>
          <p className="reveal">The engineering leaders who act now — building the right foundations before the AI wave peaks — will define the next decade of product development. Join the community. Get the frameworks. Start today.</p>
          <div className="reveal">
            <a href="/community" className="btn btn-primary btn-large">Get Started — It&apos;s Free</a>
          </div>
        </div>
      </section>

      <section className="insights-band" id="insights">
        <div className="section-inner">
          <div className="insights-grid">
            <div>
              <div className="section-label reveal">Latest Thinking</div>
              <h2 className="section-title reveal" style={{ fontSize: 'clamp(22px,3vw,32px)' }}>From the Blog</h2>
              <div style={{ margin: '24px 0' }}>
                {posts.map(p => (
                  <a key={p.id} href="/community" className="blog-preview-item">
                    <div className="blog-item-emoji">{p.emoji}</div>
                    <div>
                      <div className="blog-item-cat">{p.category}</div>
                      <div className="blog-item-title">{p.title}</div>
                      <div className="blog-item-meta">{timeAgo(p.published_at)} · {p.read_time} min read</div>
                    </div>
                  </a>
                ))}
              </div>
              <a href="/community" className="btn btn-outline" style={{ fontSize: 13 }}>Read all posts in the community →</a>
            </div>
            <div>
              <div className="section-label reveal">Research &amp; Frameworks</div>
              <h2 className="section-title reveal" style={{ fontSize: 'clamp(22px,3vw,32px)' }}>Whitepapers</h2>
              <div style={{ margin: '24px 0' }}>
                {papers.map(p => (
                  <a key={p.id} href="/community" className="wp-preview-item">
                    <div style={{ fontSize: 20 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="wp-item-title">{p.title}</div>
                      <div className="wp-item-meta">{p.category} · {p.pages} pages</div>
                    </div>
                    <div style={{ fontSize: 11, color: p.access === 'public' ? 'var(--green)' : 'var(--gold)', flexShrink: 0 }}>
                      {p.access === 'public' ? 'Free' : 'Members'}
                    </div>
                  </a>
                ))}
              </div>
              <a href="/community" className="btn btn-outline" style={{ fontSize: 13 }}>Access all whitepapers →</a>
            </div>
          </div>
        </div>
      </section>

      <ConsultingSection />

      <Footer />

      <ConsultModal source="landing_page" />
    </>
  );
}