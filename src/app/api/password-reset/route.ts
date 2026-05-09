import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvDelete } from '@/lib/cloudflare-kv';
import { updateUserPassword } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const raw = await kvGet(`reset:token:${token}`);
    if (!raw) {
      return NextResponse.json({ valid: false, error: 'Reset link expired or invalid' });
    }

    const data = JSON.parse(raw) as { email: string; userId: string; createdAt: number };

    return NextResponse.json({ valid: true, email: data.email });
  } catch (error: any) {
    console.error('Validate reset token error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const raw = await kvGet(`reset:token:${token}`);
    if (!raw) {
      return NextResponse.json({ error: 'Reset link expired or invalid. Please ask your administrator to send a new link.' }, { status: 404 });
    }

    const data = JSON.parse(raw) as { email: string; userId: string; createdAt: number };

    // Hash password and update user
    const passwordHash = await hashPassword(password);
    await updateUserPassword(data.userId, passwordHash);

    // Clean up KV tokens
    await Promise.all([
      kvDelete(`reset:token:${token}`),
      kvDelete(`reset:email:${data.email}`),
    ]);

    return NextResponse.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
