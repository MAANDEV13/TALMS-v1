import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { getUserByEmail } from '@/lib/db';
import { kvPut, kvGet, kvDelete } from '@/lib/cloudflare-kv';
import { sendPasswordResetEmail } from '@/lib/email';

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

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete old reset token if exists
    const oldToken = await kvGet(`reset:email:${email}`);
    if (oldToken) {
      await Promise.all([
        kvDelete(`reset:token:${oldToken}`),
        kvDelete(`reset:email:${email}`),
      ]);
    }

    // Generate reset token (5 minute TTL)
    const resetToken = crypto.randomUUID();
    const payload = JSON.stringify({
      email: user.email,
      userId: user.id,
      createdAt: Date.now(),
    });

    await Promise.all([
      kvPut(`reset:token:${resetToken}`, payload, 300), // 5 minutes
      kvPut(`reset:email:${email}`, resetToken, 300),
    ]);

    // Send password reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail({ to: email, name: user.name || 'User', resetUrl });

    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
