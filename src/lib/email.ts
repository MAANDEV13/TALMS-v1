// Resend email client for TALMS

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_ADDRESS = 'TALMS System <noreply@agencies.abdishakour.me>';

// ─── OTP Email (Admin Login) ────────────────────────────────────────

export async function sendOtpEmail({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: `Your TALMS Login Code: ${otp}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
          <div style="text-align:center;margin-bottom:28px">
            <h1 style="font-size:18px;font-weight:800;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:1px">
              TALMS Security Verification
            </h1>
            <p style="font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:2px">
              Ministry of Civil Aviation & Airport Development
            </p>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px">
            <p style="font-size:13px;color:#475569;margin:0 0 20px">Your one-time login code is:</p>
            <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1e40af;font-family:monospace;padding:16px;background:white;border:2px solid #e2e8f0;border-radius:10px;display:inline-block">
              ${otp}
            </div>
            <p style="font-size:12px;color:#94a3b8;margin-top:20px">This code expires in <strong>5 minutes</strong>.</p>
          </div>

          <div style="text-align:center">
            <p style="font-size:11px;color:#94a3b8;line-height:1.6">
              If you did not request this code, someone may be trying to access your account.
              Please secure your credentials immediately.
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend OTP email failed:', res.status, text);
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }

  return await res.json();
}

// ─── Invitation Email ───────────────────────────────────────────────

export async function sendInviteEmail({
  to,
  name,
  inviteUrl,
}: {
  to: string;
  name: string;
  inviteUrl: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: 'You\'ve Been Invited to TALMS',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:1px">
              TALMS — System Invitation
            </h1>
            <p style="font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:2px">
              Ministry of Civil Aviation & Airport Development
            </p>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:32px;margin-bottom:24px">
            <p style="font-size:15px;color:#1e293b;margin:0 0 8px">Hello <strong>${name}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6">
              You have been invited to join the <strong>Travel Agency License Management System (TALMS)</strong>.
              Click the button below to set up your password and activate your account.
            </p>

            <div style="text-align:center;margin:28px 0">
              <a href="${inviteUrl}"
                 style="background:#1e40af;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;display:inline-block;font-weight:700;font-size:14px;letter-spacing:0.5px">
                Accept Invitation
              </a>
            </div>

            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:20px">
              <p style="font-size:12px;color:#92400e;margin:0;font-weight:600">
                ⏱ This link expires in <strong>5 minutes</strong>. If it expires, ask your administrator to resend the invitation.
              </p>
            </div>
          </div>

          <div style="text-align:center">
            <p style="font-size:11px;color:#94a3b8;line-height:1.6">
              If you did not expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend invite email failed:', res.status, text);
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }

  return await res.json();
}

// ─── Password Reset Email ───────────────────────────────────────────

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: 'TALMS — Password Reset',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:1px">
              TALMS — Password Reset
            </h1>
            <p style="font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:2px">
              Ministry of Civil Aviation & Airport Development
            </p>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:32px;margin-bottom:24px">
            <p style="font-size:15px;color:#1e293b;margin:0 0 8px">Hello <strong>${name}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6">
              Your administrator has initiated a password reset for your TALMS account.
              Click the button below to set a new password.
            </p>

            <div style="text-align:center;margin:28px 0">
              <a href="${resetUrl}"
                 style="background:#dc2626;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;display:inline-block;font-weight:700;font-size:14px;letter-spacing:0.5px">
                Reset Password
              </a>
            </div>

            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:20px">
              <p style="font-size:12px;color:#92400e;margin:0;font-weight:600">
                ⏱ This link expires in <strong>5 minutes</strong>. If it expires, ask your administrator to send a new reset link.
              </p>
            </div>
          </div>

          <div style="text-align:center">
            <p style="font-size:11px;color:#94a3b8;line-height:1.6">
              If you did not request this, please contact your administrator immediately.
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend password reset email failed:', res.status, text);
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }

  return await res.json();
}

// ─── Generic Email ──────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend generic email failed:', res.status, text);
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }

  return await res.json();
}
