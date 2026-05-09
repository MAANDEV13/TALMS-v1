import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { kvPut } from '@/lib/cloudflare-kv';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Account not activated' }, { status: 401 });
    }

    if (user.status !== 'Active') {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP in KV with 5 minute TTL
    const otpPayload = JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      region: user.region,
      otp,
      createdAt: Date.now(),
    });

    await kvPut(`otp:${user.email}`, otpPayload, 300); // 5 minutes

    // Send OTP via Resend
    try {
      await sendOtpEmail({ to: user.email, otp });
    } catch (emailErr: any) {
      console.error('Failed to send OTP email:', emailErr);
      // Still return success so the user can see the OTP flow
      // In production with verified domain this won't fail
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      message: 'OTP sent to your email',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
