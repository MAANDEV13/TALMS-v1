import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { kvPut, kvGet } from '@/lib/cloudflare-kv';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Look up user
    const user = await getUserByEmail(email.trim().toLowerCase());

    if (!user) {
      // Security: don't reveal whether account exists
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if a reset was already sent recently (prevent spam)
    const existingReset = await kvGet(`reset:email:${user.email}`);
    if (existingReset) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const resetData = JSON.stringify({
      email: user.email,
      userId: user.id,
      createdAt: Date.now(),
    });

    // Store in KV with 5-minute TTL
    await kvPut(`reset:token:${token}`, resetData, 300);
    await kvPut(`reset:email:${user.email}`, token, 300);

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || 'User',
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
