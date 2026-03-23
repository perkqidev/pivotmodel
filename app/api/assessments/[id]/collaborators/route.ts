import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error:'Unauthorized' },{status:401});
  const { email } = await req.json();
  const target = await queryOne<{id:number}>(`SELECT id FROM users WHERE email=$1 AND status='active'`, [email?.toLowerCase()]);
  if (!target) return NextResponse.json({ error:'User not found.' },{status:404});
  try {
    await execute(`INSERT INTO assessment_collaborators (assessment_id,user_id,invited_by) VALUES ($1,$2,$3)`, [params.id,target.id,user.id]);
    return NextResponse.json({ success:true });
  } catch { return NextResponse.json({ error:'Already a collaborator.' },{status:409}); }
}
