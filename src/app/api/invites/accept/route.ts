import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { kvGet, kvDelete } from '@/lib/cloudflare-kv';
import { getUserByEmail, createUser, markInviteAccepted, logActivity } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signJwt } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // Lookup invite from KV
    const raw = await kvGet(`invite:token:${token}`);
    if (!raw) {
      return NextResponse.json({ error: 'Invitation not found or has expired' }, { status: 404 });
    }

    const invite = JSON.parse(raw) as {
      email: string;
      name: string | null;
      role: string;
      region: string | null;
      invitedBy: string;
      invitedByName: string;
      createdAt: number;
    };

    // Race condition guard
    const existing = await getUserByEmail(invite.email);
    if (existing) {
      await kvDelete(`invite:token:${token}`);
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await createUser({
      id: userId,
      email: invite.email,
      name: name || invite.name || undefined,
      password_hash: passwordHash,
      role: invite.role,
      region: invite.region || undefined,
      status: 'Active',
      invited_by: invite.invitedBy,
    });

    // Cleanup KV (single-use token)
    await Promise.all([
      kvDelete(`invite:token:${token}`),
      kvDelete(`invite:email:${invite.email}`),
    ]);

    // Mark invite as accepted in audit log
    await markInviteAccepted(invite.email);
    await logActivity(name || invite.email, 'Accepted invitation and created account', invite.email);

    // Issue JWT
    const jwt = await signJwt({
      sub: userId,
      email: invite.email,
      name: name || invite.name || '',
      role: invite.role,
      region: invite.region || undefined,
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
      user: { id: userId, email: invite.email, name: name || invite.name, role: invite.role },
    });
  } catch (error: any) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
