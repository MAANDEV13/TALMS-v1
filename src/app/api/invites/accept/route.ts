import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvDelete } from '@/lib/cloudflare-kv';
import { updateUserPassword, markInviteAccepted } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signJwt } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Lookup invite token
    const raw = await kvGet(`invite:token:${token}`);
    if (!raw) {
      return NextResponse.json({ error: 'Invitation expired or invalid. Please ask your administrator to resend.' }, { status: 404 });
    }

    const invite = JSON.parse(raw) as {
      email: string;
      userId: string;
      role: string;
      invitedBy: string;
      createdAt: number;
    };

    // Hash password and activate user
    const passwordHash = await hashPassword(password);
    await updateUserPassword(invite.userId, passwordHash);

    // Clean up KV tokens
    await Promise.all([
      kvDelete(`invite:token:${token}`),
      kvDelete(`invite:email:${invite.email}`),
    ]);

    // Mark invite as accepted in log
    try {
      await markInviteAccepted(invite.email);
    } catch { /* non-critical */ }

    // Issue JWT session
    const jwt = await signJwt({
      sub: invite.userId,
      email: invite.email,
      name: '',
      role: invite.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: invite.userId,
        email: invite.email,
        role: invite.role,
      },
    });
  } catch (error: any) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
