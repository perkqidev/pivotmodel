/** Every post is written by the book's author, so the byline isn't stored per post. */
const AUTHOR = { name: 'Siva Kumar', avatar: '/img/author-avatar.jpg' };

/** Author avatar, name and date under a post's title. Drafts show today's date. */
export function PostByline({ date }: { date?: string | null }) {
  const when = (date ? new Date(date) : new Date())
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div className="post-byline">
      <img src={AUTHOR.avatar} alt="" className="post-byline-avatar" />
      <span className="post-byline-name">{AUTHOR.name}</span>
      <time className="post-byline-date" dateTime={date || undefined}>Published on {when}</time>
    </div>
  );
}
