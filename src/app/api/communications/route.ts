import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { sendEmail } from '@/lib/email';
import { d1Query, d1Execute } from '@/lib/cloudflare-d1';

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, recipients, subject, body: messageBody } = await req.json();

    if (!type || !subject || !messageBody) {
      return NextResponse.json({ error: 'Type, subject, and body are required' }, { status: 400 });
    }

    const senderName = (payload.name as string) || 'System';

    if (type === 'email') {
      // Send emails to recipients
      if (!recipients || recipients.length === 0) {
        return NextResponse.json({ error: 'Recipients required for email' }, { status: 400 });
      }

      for (const email of recipients) {
        try {
          await sendEmail({
            to: email,
            subject: `[TALMS] ${subject}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1e293b; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
                  <h2 style="margin: 0; font-size: 18px;">TALMS Communication</h2>
                  <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.7;">From: ${senderName}</p>
                </div>
                <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                  <h3 style="margin: 0 0 16px; color: #1e293b;">${subject}</h3>
                  <div style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${messageBody}</div>
                  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    This message was sent via TALMS — Travel Agency License Management System
                  </p>
                </div>
              </div>
            `,
          });
        } catch (err) {
          console.error(`Failed to send email to ${email}:`, err);
        }
      }
    }

    if (type === 'announcement' || type === 'post') {
      // Create notification entries for all users
      try {
        await d1Execute(
          'INSERT INTO notifications (id, title, message, type, sender, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
          [crypto.randomUUID(), subject, messageBody, type, senderName]
        );
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }

    // Log the activity
    try {
      await d1Execute(
        'INSERT INTO activities (id, user_name, action, target, time, date) VALUES (?, ?, ?, ?, ?, ?)',
        [
          crypto.randomUUID(),
          senderName,
          `Sent ${type}: ${subject}`,
          type === 'email' ? `To: ${recipients?.join(', ')}` : 'All Users',
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ]
      );
    } catch (err) {
      console.error('Failed to log activity:', err);
    }

    return NextResponse.json({ success: true, message: `${type} sent successfully` });
  } catch (error: any) {
    console.error('Communications error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET: Fetch communication history
export async function GET() {
  try {
    const rows = await d1Query(
      "SELECT * FROM activities WHERE action LIKE 'Sent %' ORDER BY created_at DESC LIMIT 50"
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
