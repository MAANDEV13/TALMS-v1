import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { kvGet, kvDelete } from '@/lib/cloudflare-kv';
import { signJwt } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    // Get stored OTP from KV
    const raw = await kvGet(`otp:${email}`);
    if (!raw) {
      return NextResponse.json({ error: 'OTP expired or not found. Please login again.' }, { status: 404 });
    }

    const stored = JSON.parse(raw);

    // Validate OTP
    if (stored.otp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 401 });
    }

    // Delete OTP (single use)
    await kvDelete(`otp:${email}`);

    // Issue JWT
    const token = await signJwt({
      sub: stored.userId,
      email: stored.email,
      name: stored.name || '',
      role: stored.role,
      region: stored.region || undefined,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: stored.userId,
        email: stored.email,
        name: stored.name,
        role: stored.role,
        region: stored.region,
      },
    });
  } catch (error: any) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
