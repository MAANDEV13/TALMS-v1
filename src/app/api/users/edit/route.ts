import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { updateUser, logActivity } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await verifyJwt(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, name, role, region, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const fields: Record<string, any> = {};
    if (name !== undefined) fields.name = name;
    if (role !== undefined) fields.role = role;
    if (region !== undefined) fields.region = region || null;
    if (status !== undefined) fields.status = status;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updateUser(id, fields);
    await logActivity(admin.name || 'Admin', 'Updated user', `${name || 'User'} — ${Object.keys(fields).join(', ')}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Edit user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
