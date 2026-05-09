// Resend email client for TALMS

const RESEND_API_KEY = process.env.RESEND_API_KEY!;

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
      from: 'TALMS System <onboarding@resend.dev>',
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
