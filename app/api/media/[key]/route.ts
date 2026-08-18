import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * Serves an uploaded image. Public on purpose: images referenced by a post are
 * fetched by the browser as plain <img> requests, and keeping them public means
 * the same upload works if a post is ever made public too.
 */
export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  const row = await queryOne<{ bytes: Buffer; mime: string; size: number; id: number }>(
    'SELECT id, bytes, mime, size FROM media WHERE key = $1',
    [params.key]
  );
  if (!row) return new NextResponse('Not found', { status: 404 });

  const etag = `"m${row.id}-${row.size}"`;
  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return new NextResponse(new Uint8Array(row.bytes), {
    headers: {
      'Content-Type': row.mime,
      'Content-Length': String(row.size),
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    },
  });
}
