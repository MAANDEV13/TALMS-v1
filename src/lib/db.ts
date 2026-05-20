// TALMS Database Access Layer — Cloudflare D1
// Drop-in replacement for mockDb.ts, called from API routes
import { d1Query, d1Execute } from './cloudflare-d1';

// ─── Users ──────────────────────────────────────────────────────────

export async function getUsers() {
  return await d1Query('SELECT * FROM users ORDER BY created_at DESC');
}

export async function getUserByEmail(email: string) {
  const rows = await d1Query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function getUserById(id: string) {
  const rows = await d1Query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createUser(user: {
  id: string; email: string; name?: string; password_hash?: string | null;
  role: string; region?: string; status?: string; invited_by?: string;
}) {
  await d1Execute(
    `INSERT INTO users (id, email, name, password_hash, role, region, status, invited_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.email, user.name || null, user.password_hash || null, user.role, user.region || null, user.status || 'Active', user.invited_by || null]
  );
}

export async function updateUser(id: string, fields: Record<string, any>) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await d1Execute(`UPDATE users SET ${sets} WHERE id = ?`, [...vals, id]);
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await d1Execute(
    `UPDATE users SET password_hash = ?, status = 'Active' WHERE id = ?`,
    [passwordHash, id]
  );
}

// ─── Agencies ───────────────────────────────────────────────────────

export async function getAgencies() {
  return await d1Query('SELECT * FROM agencies ORDER BY created_at DESC');
}

export async function getAgencyById(id: string) {
  const rows = await d1Query('SELECT * FROM agencies WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createAgency(a: any) {
  await d1Execute(
    `INSERT INTO agencies (id, license_id, name, city, region, status, contact_person, phone, email, alternate_name, alternate_phone, business_structure, issue_date, expiry_date, registered_by, docs, doc_file_data, print_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.license_id, a.name, a.city, a.region, a.status || 'Active', a.contact_person, a.phone, a.email, a.alternate_name, a.alternate_phone, a.business_structure || 'solo', a.issue_date, a.expiry_date, a.registered_by, a.docs ? (typeof a.docs === 'string' ? a.docs : JSON.stringify(a.docs)) : null, a.doc_file_data ? (typeof a.doc_file_data === 'string' ? a.doc_file_data : JSON.stringify(a.doc_file_data)) : null, a.print_count || 0]
  );
}

export async function updateAgency(id: string, fields: Record<string, any>) {
  const keys = Object.keys(fields);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await d1Execute(`UPDATE agencies SET ${sets} WHERE id = ?`, [...vals, id]);
}

export async function deleteAgency(id: string) {
  await d1Execute('DELETE FROM agencies WHERE id = ?', [id]);
}

// ─── Applications ───────────────────────────────────────────────────

export async function getApplications() {
  return await d1Query('SELECT * FROM applications ORDER BY created_at DESC');
}

export async function getApplicationById(id: string) {
  const rows = await d1Query('SELECT * FROM applications WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createApplication(app: any) {
  await d1Execute(
    `INSERT INTO applications (id, agency, agency_id, region, district, business_structure, contact_person, phone, email, alternate_name, alternate_phone, register_date, type, status, status_color, registered_by, reg_fee, app_fee, discount, paid_amount, total_due, payment_receipt, uploaded_docs, doc_file_names, doc_file_data, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [app.id, app.agency, app.agency_id, app.region, app.district, app.business_structure || 'solo', app.contact_person, app.phone, app.email, app.alternate_name, app.alternate_phone, app.register_date, app.type, app.status, app.status_color, app.registered_by, app.reg_fee || 0, app.app_fee || 0, app.discount || 0, app.paid_amount || 0, app.total_due || 0, app.payment_receipt, app.uploaded_docs ? JSON.stringify(app.uploaded_docs) : null, app.doc_file_names ? JSON.stringify(app.doc_file_names) : null, (app.docFileData || app.doc_file_data) ? JSON.stringify(app.docFileData || app.doc_file_data) : null, app.date]
  );
}

export async function updateApplication(id: string, fields: Record<string, any>) {
  const keys = Object.keys(fields);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await d1Execute(`UPDATE applications SET ${sets} WHERE id = ?`, [...vals, id]);
}

export async function deleteApplication(id: string) {
  await d1Execute('DELETE FROM applications WHERE id = ?', [id]);
}

// ─── Activities ─────────────────────────────────────────────────────

export async function getActivities() {
  return await d1Query('SELECT * FROM activities ORDER BY created_at DESC');
}

export async function logActivity(userName: string, action: string, target: string) {
  // Use GMT+3 (East Africa Time) for all timestamps
  const now = new Date();
  const gmt3Options = { timeZone: 'Africa/Nairobi' } as const;
  await d1Execute(
    'INSERT INTO activities (id, user_name, action, target, time, date) VALUES (?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), userName, action, target,
     now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', ...gmt3Options }),
     now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...gmt3Options })]
  );
}

// ─── Notifications ──────────────────────────────────────────────────

export async function getNotifications() {
  return await d1Query('SELECT * FROM notifications ORDER BY created_at DESC');
}

export async function getNotificationsForUser(userId?: string, role?: string) {
  // Return notifications targeted at this user, their role, or all users (no user_id/role set)
  return await d1Query(
    `SELECT * FROM notifications 
     WHERE (user_id IS NULL AND role IS NULL) 
        OR user_id = ? 
        OR role = ? 
     ORDER BY created_at DESC`,
    [userId || '', role || '']
  );
}

export async function createNotification(notif: {
  title: string; message?: string; type?: string; link?: string;
  user_id?: string; role?: string;
}) {
  await d1Execute(
    `INSERT INTO notifications (id, user_id, role, title, message, type, link, unread)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [crypto.randomUUID(), notif.user_id || null, notif.role || null,
     notif.title, notif.message || null, notif.type || 'system', notif.link || null]
  );
}

export async function markNotificationRead(id: string) {
  await d1Execute('UPDATE notifications SET unread = 0 WHERE id = ?', [id]);
}

export async function markAllNotificationsRead(userId?: string, role?: string) {
  if (userId) {
    await d1Execute(
      `UPDATE notifications SET unread = 0 
       WHERE (user_id IS NULL AND role IS NULL) OR user_id = ? OR role = ?`,
      [userId, role || '']
    );
  } else {
    await d1Execute('UPDATE notifications SET unread = 0');
  }
}

export async function clearNotifications() {
  await d1Execute('DELETE FROM notifications');
}

// ─── Fines ──────────────────────────────────────────────────────────

export async function getFines() {
  return await d1Query('SELECT * FROM fines ORDER BY created_at DESC');
}

export async function createFine(fine: any) {
  await d1Execute(
    'INSERT INTO fines (id, agency_id, agency_name, amount, reason, issued_by, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [fine.id, fine.agency_id, fine.agency_name, fine.amount, fine.reason, fine.issued_by, fine.date, fine.status || 'Pending']
  );
}

// ─── Agency Changes ─────────────────────────────────────────────────

export async function getAgencyChanges() {
  return await d1Query("SELECT * FROM agency_changes WHERE status = 'pending' ORDER BY created_at DESC");
}

export async function createAgencyChange(change: any) {
  await d1Execute(
    'INSERT INTO agency_changes (id, agency_id, type, data, requester, date) VALUES (?, ?, ?, ?, ?, ?)',
    [change.id, change.agency_id, change.type, JSON.stringify(change.data), change.requester, change.date]
  );
}

export async function deleteAgencyChange(id: string) {
  await d1Execute('DELETE FROM agency_changes WHERE id = ?', [id]);
}

// ─── Invite Log ─────────────────────────────────────────────────────

export async function createInviteLog(log: { id: string; email: string; role: string; region?: string; invited_by: string }) {
  await d1Execute(
    'INSERT INTO invite_log (id, email, role, region, invited_by) VALUES (?, ?, ?, ?, ?)',
    [log.id, log.email, log.role, log.region || null, log.invited_by]
  );
}

export async function markInviteAccepted(email: string) {
  await d1Execute(
    "UPDATE invite_log SET accepted_at = datetime('now') WHERE email = ? AND accepted_at IS NULL",
    [email]
  );
}

// ─── Settings ───────────────────────────────────────────────────────

export async function getSettings() {
  const rows = await d1Query('SELECT * FROM settings');
  const settings: Record<string, any> = {};
  for (const row of rows) {
    settings[row.key] = isNaN(Number(row.value)) ? row.value : Number(row.value);
  }
  return settings;
}

export async function saveSetting(key: string, value: string) {
  await d1Execute(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    [key, value, value]
  );
}

// ─── Utilities ──────────────────────────────────────────────────────

export async function getNextLicenseId() {
  // Use GMT+3 year
  const gmt3Now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const currentYear = gmt3Now.getUTCFullYear();
  const rows = await d1Query("SELECT COUNT(*) as count FROM agencies WHERE license_id LIKE ?", [`%/${currentYear}`]);
  const count = (rows[0]?.count || 0) + 1;
  return `${String(count).padStart(3, '0')}-MOCAAD-DCA/${currentYear}`;
}

export async function checkAgencyName(name: string): Promise<boolean> {
  const agencies = await d1Query('SELECT id FROM agencies WHERE LOWER(name) = LOWER(?)', [name]);
  const apps = await d1Query("SELECT id FROM applications WHERE LOWER(agency) = LOWER(?) AND status != 'Draft'", [name]);
  return agencies.length === 0 && apps.length === 0;
}
