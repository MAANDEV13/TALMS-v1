// Resend email client for TALMS invitation system

const RESEND_API_KEY = process.env.RESEND_API_KEY!;

export async function sendInviteEmail({
  to,
  invitedByName,
  role,
  region,
  inviteUrl,
}: {
  to: string;
  invitedByName: string;
  role: string;
  region?: string;
  inviteUrl: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TALMS System <onboarding@resend.dev>',
      to,
      subject: `You've been invited to TALMS by ${invitedByName}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:1px">
              Travel Agency License Management System
            </h1>
            <p style="font-size:12px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:2px">
              Ministry of Civil Aviation & Airport Development
            </p>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:32px;margin-bottom:24px">
            <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 12px">
              You've been invited!
            </h2>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 8px">
              <strong>${invitedByName}</strong> has invited you to join TALMS as a
              <strong style="color:#1e40af;text-transform:capitalize">${role.replace('_', ' ')}</strong>${region ? ` for the <strong>${region}</strong> region` : ''}.
            </p>
            <p style="font-size:14px;color:#475569;line-height:1.6;margin:0">
              Click the button below to set up your account and get started.
            </p>
          </div>

          <div style="text-align:center;margin-bottom:32px">
            <a href="${inviteUrl}"
               style="display:inline-block;background:#1e40af;color:white;padding:14px 40px;
                      border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;
                      letter-spacing:0.5px;text-transform:uppercase">
              Accept Invitation
            </a>
          </div>

          <div style="border-top:1px solid #e2e8f0;padding-top:20px;text-align:center">
            <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6">
              This invitation link expires in <strong>48 hours</strong>.<br>
              If you did not expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend email failed:', res.status, text);
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }

  return await res.json();
}
