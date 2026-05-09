import { NextRequest, NextResponse } from 'next/server';
import { kvGet } from '@/lib/cloudflare-kv';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const raw = await kvGet(`invite:token:${token}`);
    if (!raw) {
      return NextResponse.json({ valid: false, error: 'Invitation expired or invalid' });
    }

    const invite = JSON.parse(raw) as {
      email: string;
      userId: string;
      role: string;
      invitedBy: string;
      createdAt: number;
    };

    return NextResponse.json({
      valid: true,
      email: invite.email,
    });
  } catch (error: any) {
    console.error('Validate invite error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
