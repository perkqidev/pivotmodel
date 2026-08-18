import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024;

/** Turn "Product Engineer (1).JPG" into "product-engineer-1". */
function slugify(filename: string) {
  const base = filename.replace(/\.[^.]+$/, '');
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'image';
}

/** Keys are used directly in URLs, so they must be unique. */
async function uniqueKey(base: string) {
  let key = base;
  for (let n = 2; n < 500; n++) {
    const clash = await queryOne('SELECT id FROM media WHERE key = $1', [key]);
    if (!clash) return key;
    key = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const media = await query(
    'SELECT id, key, filename, mime, size, created_at FROM media ORDER BY created_at DESC'
  );
  return NextResponse.json({ media });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Upload could not be read.' }, { status: 400 });
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'No files received.' }, { status: 400 });

  const uploaded: unknown[] = [];
  const rejected: { filename: string; reason: string }[] = [];

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      rejected.push({ filename: file.name, reason: 'Only JPG, PNG, WebP and GIF are allowed.' });
      continue;
    }
    if (file.size > MAX_BYTES) {
      rejected.push({ filename: file.name, reason: 'Larger than 8 MB.' });
      continue;
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const key = await uniqueKey(slugify(file.name));
    const row = await queryOne<{ id: number; key: string }>(
      `INSERT INTO media (key, filename, mime, size, bytes, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, key`,
      [key, file.name, file.type, file.size, bytes, user.id]
    );
    if (row) uploaded.push({ ...row, filename: file.name, mime: file.type, size: file.size, url: `/api/media/${row.key}` });
  }

  return NextResponse.json({ uploaded, rejected });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await req.json();
  await execute('DELETE FROM media WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
