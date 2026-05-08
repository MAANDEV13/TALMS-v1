import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { getUserByEmail, createInviteLog, logActivity } from '@/lib/db';
import { kvGet, kvPut } from '@/lib/cloudflare-kv';
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

    const { email, role, region, name } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check for pending invite
    const pendingInvite = await kvGet(`invite:email:${email}`);
    if (pendingInvite) {
      return NextResponse.json({ error: 'Invite already pending for this email' }, { status: 409 });
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID();
    const payload = JSON.stringify({
      email,
      name: name || null,
      role,
      region: region || null,
      invitedBy: admin.sub,
      invitedByName: admin.name,
      createdAt: Date.now(),
    });

    // Store in KV with 48h TTL
    const TTL_48H = 172800;
    await Promise.all([
      kvPut(`invite:token:${inviteToken}`, payload, TTL_48H),
      kvPut(`invite:email:${email}`, inviteToken, TTL_48H),
    ]);

    // Log the invite
    await createInviteLog({
      id: crypto.randomUUID(),
      email,
      role,
      region: region || undefined,
      invited_by: admin.sub,
    });

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talms-v1.vercel.app';
    await sendInviteEmail({
      to: email,
      invitedByName: admin.name || 'Admin',
      role,
      region,
      inviteUrl: `${appUrl}/accept-invite?token=${inviteToken}`,
    });

    await logActivity(admin.name || 'Admin', 'Sent invitation to', email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
