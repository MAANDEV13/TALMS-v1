import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { getUserByEmail, createUser, logActivity } from '@/lib/db';
import { hashPassword } from '@/lib/password';

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

    const { name, email, password, role, region } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await createUser({
      id: userId,
      email,
      name,
      password_hash: passwordHash,
      role,
      region: region || undefined,
      status: 'Active',
      invited_by: admin.sub,
    });

    await logActivity(admin.name || 'Admin', 'Created new user', `${name} (${email})`);

    return NextResponse.json({
      success: true,
      user: { id: userId, email, name, role, region },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
