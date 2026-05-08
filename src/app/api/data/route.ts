import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import * as db from '@/lib/db';

// Auth helper
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
  const table = searchParams.get('table');

  try {
    switch (table) {
      case 'agencies':
        return NextResponse.json(await db.getAgencies());
      case 'applications':
        return NextResponse.json(await db.getApplications());
      case 'activities':
        return NextResponse.json(await db.getActivities());
      case 'notifications':
        return NextResponse.json(await db.getNotifications());
      case 'fines':
        return NextResponse.json(await db.getFines());
      case 'agency_changes':
        return NextResponse.json(await db.getAgencyChanges());
      case 'users':
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        return NextResponse.json(await db.getUsers());
      case 'settings':
        return NextResponse.json(await db.getSettings());
      default:
        return NextResponse.json({ error: 'Unknown table' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('DB GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { table, action, data } = body;

  try {
    switch (table) {
      case 'agencies': {
        if (action === 'create') await db.createAgency(data);
        else if (action === 'update') await db.updateAgency(data.id, data.fields);
        else if (action === 'delete') await db.deleteAgency(data.id);
        break;
      }
      case 'applications': {
        if (action === 'create') await db.createApplication(data);
        else if (action === 'update') await db.updateApplication(data.id, data.fields);
        break;
      }
      case 'activities': {
        if (action === 'log') await db.logActivity(data.user, data.action, data.target);
        break;
      }
      case 'fines': {
        if (action === 'create') await db.createFine(data);
        break;
      }
      case 'agency_changes': {
        if (action === 'create') await db.createAgencyChange(data);
        else if (action === 'delete') await db.deleteAgencyChange(data.id);
        break;
      }
      case 'notifications': {
        if (action === 'clear') await db.clearNotifications();
        break;
      }
      case 'settings': {
        if (action === 'save') await db.saveSetting(data.key, data.value);
        break;
      }
      case 'users': {
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // User creation is handled via invitation flow, not direct creation
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown table' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
