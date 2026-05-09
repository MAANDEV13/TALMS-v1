import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { getUserByEmail } from '@/lib/db';
import { kvPut, kvDelete } from '@/lib/cloudflare-kv';
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

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status === 'Active' && user.password_hash) {
      return NextResponse.json({ error: 'User already activated' }, { status: 400 });
    }

    // Delete old token if exists
    const oldToken = await import('@/lib/cloudflare-kv').then(m => m.kvGet(`invite:email:${email}`));
    if (oldToken) {
      await Promise.all([
        kvDelete(`invite:token:${oldToken}`),
        kvDelete(`invite:email:${email}`),
      ]);
    }

    // Generate new token (5 minute TTL)
    const inviteToken = crypto.randomUUID();
    const payload = JSON.stringify({
      email: user.email,
      userId: user.id,
      role: user.role,
      invitedBy: admin.sub,
      createdAt: Date.now(),
    });

    await Promise.all([
      kvPut(`invite:token:${inviteToken}`, payload, 300),
      kvPut(`invite:email:${email}`, inviteToken, 300),
    ]);

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite?token=${inviteToken}`;

    await sendInviteEmail({ to: email, name: user.name || 'User', inviteUrl });

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' });
  } catch (error: any) {
    console.error('Resend invite error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
