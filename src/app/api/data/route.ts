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
      case 'applications': {
        const apps = await db.getApplications();
        // Hide financial fields from non-admin/director
        const canSeeFinancials = ['admin', 'director'].includes(user.role);
        if (!canSeeFinancials) {
          const sanitized = (apps as any[]).map((app: any) => {
            const { received_amount, paid_amount, ...rest } = app;
            return rest;
          });
          return NextResponse.json(sanitized);
        }
        return NextResponse.json(apps);
      }
      case 'activities':
        return NextResponse.json(await db.getActivities());
      case 'notifications':
        return NextResponse.json(await db.getNotificationsForUser(user.sub, user.role));
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
        if (action === 'create') {
          data.registered_by = user.name;
          await db.createAgency(data);
          // Notify admin & GD about new agency registration
          try {
            await db.createNotification({
              title: 'New Agency Registered',
              message: `${data.name} — registered by ${user.name}`,
              type: 'system',
              role: 'admin',
              link: '/agencies'
            });
            await db.createNotification({
              title: 'New Agency Registered',
              message: `${data.name} — registered by ${user.name}`,
              type: 'system',
              role: 'general_director',
              link: '/agencies'
            });
          } catch (e) { /* non-blocking */ }
        }
        else if (action === 'update') {
          await db.updateAgency(data.id, data.fields);
          // Notify about agency updates
          try {
            const fieldNames = Object.keys(data.fields || {}).join(', ');
            await db.createNotification({
              title: 'Agency Record Updated',
              message: `Fields updated: ${fieldNames} — by ${user.name}`,
              type: 'system',
              role: 'admin',
              link: '/agencies'
            });
          } catch (e) { /* non-blocking */ }
        }
        else if (action === 'delete') {
          await db.deleteAgency(data.id);
          // Notify about agency deletion
          try {
            await db.createNotification({
              title: 'Agency Deleted',
              message: `An agency record was deleted by ${user.name}`,
              type: 'alert',
              role: 'admin',
              link: '/agencies'
            });
            await db.createNotification({
              title: 'Agency Deleted',
              message: `An agency record was deleted by ${user.name}`,
              type: 'alert',
              role: 'general_director',
              link: '/agencies'
            });
          } catch (e) { /* non-blocking */ }
        }
        break;
      }
      case 'applications': {
        if (action === 'create') {
          data.registered_by = user.name;
          await db.createApplication(data);
          // Auto-notify director + GD + admin about new application
          try {
            await db.createNotification({
              title: `New ${data.type || 'Application'} Submitted`,
              message: `${data.agency} — submitted by ${user.name}`,
              type: 'approval',
              role: 'director',
              link: '/approvals'
            });
            await db.createNotification({
              title: `New ${data.type || 'Application'} Submitted`,
              message: `${data.agency} — submitted by ${user.name}`,
              type: 'approval',
              role: 'general_director',
              link: '/approvals'
            });
            await db.createNotification({
              title: `New ${data.type || 'Application'} Submitted`,
              message: `${data.agency} — submitted by ${user.name}`,
              type: 'approval',
              role: 'admin',
              link: '/licenses'
            });
          } catch (e) { /* notification failures shouldn't block application creation */ }
        }
        else if (action === 'update') {
          await db.updateApplication(data.id, data.fields);
          // Auto-notify when status changes
          if (data.fields?.status) {
            try {
              await db.createNotification({
                title: `Application Status Updated`,
                message: `Status changed to: ${data.fields.status} — by ${user.name}`,
                type: 'system',
                role: 'admin',
                link: '/licenses'
              });
              await db.createNotification({
                title: `Application Status Updated`,
                message: `Status changed to: ${data.fields.status} — by ${user.name}`,
                type: 'system',
                role: 'general_director',
                link: '/approvals'
              });
            } catch (e) { /* non-blocking */ }
          }
        }
        else if (action === 'delete') await db.deleteApplication(data.id);
        break;
      }
      case 'activities': {
        if (action === 'log') {
          await db.logActivity(data.user, data.action, data.target);
          // Generate notification for admin on every audit log entry
          try {
            await db.createNotification({
              title: `Audit Log: ${data.action}`,
              message: `${data.user} — ${data.action} ${data.target}`,
              type: 'system',
              role: 'admin',
              link: '/activities'
            });
          } catch (e) { /* non-blocking */ }
        }
        break;
      }
      case 'fines': {
        if (action === 'create') {
          await db.createFine(data);
          // Notify admin & GD about new fine
          try {
            await db.createNotification({
              title: 'New Fine Issued',
              message: `$${data.amount} fine for ${data.agency_name} — issued by ${data.issued_by || user.name}`,
              type: 'alert',
              role: 'admin',
              link: '/fines'
            });
            await db.createNotification({
              title: 'New Fine Issued',
              message: `$${data.amount} fine for ${data.agency_name} — issued by ${data.issued_by || user.name}`,
              type: 'alert',
              role: 'general_director',
              link: '/fines'
            });
          } catch (e) { /* non-blocking */ }
        }
        break;
      }
      case 'agency_changes': {
        if (action === 'create') {
          await db.createAgencyChange(data);
          // Notify GD about pending agency change request
          try {
            await db.createNotification({
              title: `Agency ${data.type === 'delete' ? 'Deletion' : 'Edit'} Request`,
              message: `${data.requester} requested a ${data.type} for agency ${data.agency_id}`,
              type: 'approval',
              role: 'general_director',
              link: '/approvals'
            });
            await db.createNotification({
              title: `Agency Change Request Submitted`,
              message: `${data.requester} submitted a ${data.type} request`,
              type: 'system',
              role: 'admin',
              link: '/approvals'
            });
          } catch (e) { /* non-blocking */ }
        }
        else if (action === 'delete') await db.deleteAgencyChange(data.id);
        break;
      }
      case 'notifications': {
        if (action === 'create') await db.createNotification(data);
        else if (action === 'markRead') await db.markNotificationRead(data.id);
        else if (action === 'markAllRead') await db.markAllNotificationsRead(user.sub, user.role);
        else if (action === 'clear') await db.clearNotifications();
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
