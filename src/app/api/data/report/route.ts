import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { d1Query } from '@/lib/cloudflare-d1';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await verifyJwt(token);
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  // Non-admin users can only see their own report
  if (user.role !== 'admin' && userId && userId !== user.sub) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetUserId = userId || user.sub;

  try {
    // Fetch user profile
    const users = await d1Query('SELECT id, name, email, role, region, status, created_at FROM users WHERE id = ?', [targetUserId]);
    const profile = users[0];
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch applications registered by this user
    const applications = await d1Query(
      'SELECT id, agency, type, status, date, region, created_at FROM applications WHERE registered_by = ? ORDER BY created_at DESC',
      [profile.name]
    );

    // Fetch agencies registered by this user
    const agencies = await d1Query(
      'SELECT id, license_id, name, status, region, city, created_at FROM agencies WHERE registered_by = ? ORDER BY created_at DESC',
      [profile.name]
    );

    // Fetch activities by this user
    const activities = await d1Query(
      'SELECT id, action, target, time, date, created_at FROM activities WHERE user_name = ? ORDER BY created_at DESC LIMIT 50',
      [profile.name]
    );

    // Summary stats
    const summary = {
      totalApplications: applications.length,
      newApplications: applications.filter((a: any) => a.type === 'New').length,
      renewalApplications: applications.filter((a: any) => a.type === 'Renewal').length,
      approvedApplications: applications.filter((a: any) => a.status?.includes('Approved')).length,
      totalAgenciesRegistered: agencies.length,
      activeAgencies: agencies.filter((a: any) => a.status === 'Active').length,
      totalActivities: activities.length,
    };

    return NextResponse.json({
      profile,
      summary,
      applications,
      agencies,
      activities,
    });
  } catch (error: any) {
    console.error('Report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
