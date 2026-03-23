import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

async function canAccess(req: NextRequest, id: string) {
  const user = await getSessionFromRequest(req);
  if (!user) return null;
  const rows = await query(`SELECT 1 FROM assessments a LEFT JOIN assessment_collaborators ac ON ac.assessment_id=a.id WHERE a.id=$1 AND (a.user_id=$2 OR ac.user_id=$2)`, [id, user.id]);
  return rows.length > 0 ? user : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const context = await query(`SELECT * FROM skillset_context WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  const items = await query(`SELECT * FROM skillset_items WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  return NextResponse.json({ context, items });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { context, items } = await req.json();
  if (context && Array.isArray(context)) {
    for (const c of context) {
      await execute(`UPDATE skillset_context SET field_value=$1 WHERE id=$2 AND assessment_id=$3`, [c.field_value, c.id, params.id]);
    }
  }
  if (items && Array.isArray(items)) {
    for (const item of items) {
      await execute(
        `UPDATE skillset_items SET item_name=$1,description=$2,importance=$3,current_level=$4,required_level=$5,gap=$6,notes=$7 WHERE id=$8 AND assessment_id=$9`,
        [item.item_name,item.description,item.importance,item.current_level,item.required_level,item.gap,item.notes,item.id,params.id]
      );
    }
  }
  await execute(`UPDATE assessments SET updated_at=NOW() WHERE id=$1`, [params.id]);
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, section, category } = await req.json();
  if (type === 'context') {
    const r = await query<{id:number}>(`INSERT INTO skillset_context (assessment_id,field_name,field_group) VALUES ($1,'New Field','basics') RETURNING id`, [params.id]);
    return NextResponse.json({ id: r[0].id });
  }
  const r = await query<{id:number}>(`INSERT INTO skillset_items (assessment_id,section,category,item_name,importance,required_level) VALUES ($1,$2,$3,'New Skill','Important','Intermediate') RETURNING id`, [params.id, section || 'Core Engineering', category || 'General']);
  return NextResponse.json({ id: r[0].id });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, row_id } = await req.json();
  if (type === 'context') {
    await execute(`DELETE FROM skillset_context WHERE id=$1 AND assessment_id=$2`, [row_id, params.id]);
  } else {
    await execute(`DELETE FROM skillset_items WHERE id=$1 AND assessment_id=$2`, [row_id, params.id]);
  }
  return NextResponse.json({ success: true });
}
