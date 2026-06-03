import styles from './Insights.module.css';

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

function pad(n: number) { return n.toString().padStart(2, '0'); }

export function Insights({ posts, papers }: Props) {
  return (
    <section id="insights" className={styles.insights}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h2>Latest <strong>thinking.</strong></h2>
          <p>From the blog &amp; whitepapers</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.col}>
            <h5>— From the blog</h5>
            {posts.map((p, i) => (
              <a key={p.id} href="/community" className={styles.item}>
                <span className={styles.ic}>{pad(i + 1)}</span>
                <div>
                  <div className={styles.cat}>{p.category} · {p.read_time} min read</div>
                  <h4>{p.title}</h4>
                  <div className={styles.meta}>{p.excerpt}</div>
                </div>
              </a>
            ))}
            <a href="/community" className={styles.cta}>
              Read all posts in the community <span className={styles.ar}>→</span>
            </a>
          </div>
          <div className={styles.col}>
            <h5>— Whitepapers</h5>
            {papers.map((p, i) => (
              <a key={p.id} href="/community" className={styles.item}>
                <span className={styles.ic}>{pad(i + 1)}</span>
                <div>
                  <div className={styles.cat}>{p.category} · {p.access === 'public' ? 'Free' : 'Members'}</div>
                  <h4>{p.title}</h4>
                  <div className={styles.meta}>{p.pages} pages</div>
                </div>
              </a>
            ))}
            <a href="/community" className={styles.cta}>
              Access all whitepapers <span className={styles.ar}>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
