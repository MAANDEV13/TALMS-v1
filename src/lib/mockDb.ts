// MOCK_DB Compatibility Bridge
// This replaces the original mockDb.ts localStorage implementation
// with API calls to /api/data that connect to Cloudflare D1.
// All existing page code continues to work with minimal changes.

'use client';

// Cache to avoid redundant fetches within the same render cycle
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 2000; // 2 seconds

async function fetchTable(table: string): Promise<any[]> {
  const now = Date.now();
  const cached = cache[table];
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/data?table=${table}`);
    if (!res.ok) return [];
    const data = await res.json();
    const result = Array.isArray(data) ? data : [];
    cache[table] = { data: result, timestamp: now };
    return result;
  } catch {
    return [];
  }
}

async function postData(table: string, action: string, data: any) {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, action, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// The MOCK_DB object — same interface as before, but async-aware
// For synchronous callers, returns cached data or empty arrays
export const MOCK_DB = {
  init: () => {
    // No-op — D1 doesn't need initialization
  },

  // Synchronous get that returns cached data
  // Pages should migrate to async version over time
  get: (table: string): any[] => {
    const cached = cache[table];
    if (cached) return cached.data;
    // Trigger async fetch for next call
    fetchTable(table);
    return [];
  },

  // Async version for new code
  getAsync: async (table: string): Promise<any[]> => {
    return await fetchTable(table);
  },

  save: async (table: string, data: any) => {
    // For bulk save, this is a no-op in D1 — individual operations are used
    cache[table] = { data, timestamp: Date.now() };
  },

  // Application methods
  addApplication: async (app: any) => {
    const success = await postData('applications', 'create', {
      id: app.id || crypto.randomUUID(),
      agency: app.agency,
      agency_id: app.agencyId || app.agency_id,
      region: app.region,
      district: app.district,
      contact_person: app.contactPerson || app.contact_person,
      phone: app.phone,
      email: app.email,
      alternate_name: app.alternatePerson?.name || app.alternate_name,
      alternate_phone: app.alternatePerson?.phone || app.alternate_phone,
      register_date: app.registerDate || app.register_date,
      type: app.type,
      status: app.status || 'Under Review',
      status_color: app.statusColor || app.status_color || 'amber',
      registered_by: app.registeredBy || app.registered_by,
      reg_fee: app.financials?.registrationFee || app.reg_fee || 0,
      app_fee: app.financials?.applicationFee || app.app_fee || 0,
      discount: app.financials?.discount || app.discount || 0,
      paid_amount: app.financials?.paidAmount || app.paid_amount || 0,
      total_due: app.financials?.totalDue || app.total_due || 0,
      payment_receipt: app.financials?.paymentReceipt || app.payment_receipt,
      uploaded_docs: app.uploadedDocs || app.uploaded_docs,
      doc_file_names: app.docFileNames || app.doc_file_names,
      date: app.date,
    });
    delete cache['applications'];
    return success;
  },

  updateApplication: async (app: any) => {
    const fields: Record<string, any> = {};
    if (app.status) fields.status = app.status;
    if (app.statusColor || app.status_color) fields.status_color = app.statusColor || app.status_color;
    if (app.reviewComment || app.review_comment) fields.review_comment = app.reviewComment || app.review_comment;
    if (app.financials) {
      fields.discount = app.financials.discount;
      fields.paid_amount = app.financials.paidAmount;
      fields.total_due = app.financials.totalDue;
    }
    await postData('applications', 'update', { id: app.id, fields });
    delete cache['applications'];
  },

  updateApplicationStatus: async (id: string, status: string, color: string, comment?: string, agencyId?: string) => {
    const fields: Record<string, any> = { status, status_color: color };
    if (comment) fields.review_comment = comment;
    if (agencyId) fields.agency_id = agencyId;
    await postData('applications', 'update', { id, fields });
    delete cache['applications'];
  },

  // Activity logging
  logActivity: async (user: string, action: string, target: string) => {
    await postData('activities', 'log', { user, action, target });
    delete cache['activities'];
  },

  // Settings
  getSettings: (): any => {
    const cached = cache['settings'];
    if (cached) return cached.data;
    fetchTable('settings');
    return {
      registrationFee: 1000,
      renewalFee: 600,
      applicationFee: 500,
      certificateTitle: 'TRAVEL AGENCY LICENSE',
      certificateSubtitle: 'Ministry of Civil Aviation and Airport Development',
    };
  },

  getSettingsAsync: async () => {
    return await fetchTable('settings');
  },

  saveSettings: async (settings: Record<string, any>) => {
    for (const [key, value] of Object.entries(settings)) {
      await postData('settings', 'save', { key, value: String(value) });
    }
    delete cache['settings'];
  },

  // Agency name check
  checkAgencyName: (name: string): boolean => {
    const agencies = cache['agencies']?.data || [];
    const apps = cache['applications']?.data || [];
    const agencyMatch = agencies.some((a: any) => a.name?.toLowerCase() === name.toLowerCase());
    const appMatch = apps.some((a: any) => a.agency?.toLowerCase() === name.toLowerCase() && a.status !== 'Draft');
    return !agencyMatch && !appMatch;
  },

  // License ID generation
  getNextLicenseId: (): string => {
    const currentYear = new Date().getFullYear();
    const agencies = cache['agencies']?.data || [];
    const yearAgencies = agencies.filter((a: any) => a.licenseId?.endsWith(`/${currentYear}`) || a.license_id?.endsWith(`/${currentYear}`));
    const count = yearAgencies.length + 1;
    return `${String(count).padStart(3, '0')}-MOCAAD-DCA/${currentYear}`;
  },

  getNextLicenseIdAsync: async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const agencies = await fetchTable('agencies');
    const yearAgencies = agencies.filter((a: any) => a.licenseId?.endsWith(`/${currentYear}`) || a.license_id?.endsWith(`/${currentYear}`));
    const count = yearAgencies.length + 1;
    return `${String(count).padStart(3, '0')}-MOCAAD-DCA/${currentYear}`;
  },

  addAgency: async (agency: any) => {
    await postData('agencies', 'create', agency);
    delete cache['agencies'];
  },

  getDraftId: (): string => {
    return `DRAFT-${Date.now()}`;
  },

  // User management (admin only)
  addUser: async (userData: any) => {
    // User creation now goes through invitation system
    // This is kept for compatibility but invitations are preferred
    await postData('activities', 'log', {
      user: 'Admin',
      action: 'Attempted to create user (use invitation system)',
      target: userData.email
    });
  },

  // Agency change management
  requestAgencyChange: async (change: any) => {
    await postData('agency_changes', 'create', change);
    delete cache['agency_changes'];
  },

  approveAgencyChange: async (id: string) => {
    await postData('agency_changes', 'delete', { id });
    delete cache['agency_changes'];
  },

  // Preload data for pages that need synchronous access
  preload: async (...tables: string[]) => {
    await Promise.all(tables.map(t => fetchTable(t)));
  },
};
