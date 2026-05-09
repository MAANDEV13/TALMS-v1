import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { getUserByEmail, createUser, logActivity, createInviteLog } from '@/lib/db';
import { kvPut, kvGet } from '@/lib/cloudflare-kv';
import { sendInviteEmail } from '@/lib/email';

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

    const { name, email, role, region } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    // Check duplicate user
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check for pending invite
    const existingInvite = await kvGet(`invite:email:${email}`);
    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 409 });
    }

    // Create user with status 'Invited' and no password
    const userId = crypto.randomUUID();
    await createUser({
      id: userId,
      email,
      name,
      password_hash: null,
      role,
      region: region || undefined,
      status: 'Invited',
      invited_by: admin.sub,
    });

    // Generate invite token and store in KV (5 minute TTL)
    const inviteToken = crypto.randomUUID();
    const payload = JSON.stringify({
      email,
      userId,
      role,
      invitedBy: admin.sub,
      createdAt: Date.now(),
    });

    await Promise.all([
      kvPut(`invite:token:${inviteToken}`, payload, 300), // 5 minutes
      kvPut(`invite:email:${email}`, inviteToken, 300),
    ]);

    // Log invite
    await createInviteLog({
      id: crypto.randomUUID(),
      email,
      role,
      region: region || undefined,
      invited_by: admin.sub,
    });

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite?token=${inviteToken}`;

    try {
      await sendInviteEmail({ to: email, name, inviteUrl });
    } catch (emailErr: any) {
      console.error('Failed to send invite email:', emailErr);
      // User is created, token is stored — email failure is non-fatal
    }

    await logActivity(admin.name || 'Admin', 'Sent invitation', `${name} (${email})`);

    return NextResponse.json({
      success: true,
      user: { id: userId, email, name, role, region, status: 'Invited' },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
