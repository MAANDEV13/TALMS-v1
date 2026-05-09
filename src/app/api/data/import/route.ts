import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import { d1Query, d1Execute } from '@/lib/cloudflare-d1';
import { logActivity } from '@/lib/db';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await verifyJwt(token);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });

  try {
    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    // Fetch existing agencies for duplicate checking
    const existingAgencies = await d1Query('SELECT license_id, LOWER(name) as name_lower FROM agencies');
    const existingIds = new Set(existingAgencies.map((a: any) => a.license_id?.toLowerCase()));
    const existingNames = new Set(existingAgencies.map((a: any) => a.name_lower));

    const imported: string[] = [];
    const skipped: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];

      // Validate required fields
      if (!r.name || !r.name.trim()) {
        skipped.push({ row: i + 1, name: r.name || '(empty)', reason: 'Missing agency name' });
        continue;
      }

      // Check duplicates by name
      if (existingNames.has(r.name.trim().toLowerCase())) {
        skipped.push({ row: i + 1, name: r.name, reason: 'Duplicate agency name' });
        continue;
      }

      // Check duplicates by license_id
      if (r.license_id && existingIds.has(r.license_id.trim().toLowerCase())) {
        skipped.push({ row: i + 1, name: r.name, reason: 'Duplicate license ID' });
        continue;
      }

      // Generate ID and license_id if not provided
      const id = crypto.randomUUID();
      const licenseId = r.license_id || `LEGACY-${String(i + 1).padStart(3, '0')}`;

      try {
        await d1Execute(
          `INSERT INTO agencies (id, license_id, name, city, region, status, contact_person, phone, email, issue_date, expiry_date, registered_by, docs, doc_file_data, print_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            licenseId,
            r.name.trim(),
            r.city || r.district || null,
            r.region || null,
            r.status || 'Active',
            r.contact_person || null,
            r.phone || null,
            r.email || null,
            r.issue_date || r.register_date || null,
            r.expiry_date || null,
            r.registered_by || 'Legacy Import',
            null,
            null,
            0
          ]
        );

        imported.push(r.name.trim());
        // Track for duplicate checking within this batch
        existingNames.add(r.name.trim().toLowerCase());
        existingIds.add(licenseId.toLowerCase());
      } catch (err: any) {
        skipped.push({ row: i + 1, name: r.name, reason: err.message || 'Insert failed' });
      }
    }

    // Log the bulk import activity
    await logActivity(
      user.name || 'Admin',
      `Bulk imported ${imported.length} agencies from legacy CSV (${skipped.length} skipped)`,
      'Data Migration'
    );

    return NextResponse.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      total: records.length,
      skippedDetails: skipped,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
