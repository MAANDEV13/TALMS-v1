-- TALMS D1 Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'officer',
  region TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  invited_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY,
  license_id TEXT UNIQUE,
  name TEXT NOT NULL,
  city TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  registered_by TEXT,
  print_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  agency TEXT NOT NULL,
  agency_id TEXT,
  region TEXT,
  district TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  alternate_name TEXT,
  alternate_phone TEXT,
  register_date TEXT,
  type TEXT NOT NULL DEFAULT 'New',
  status TEXT NOT NULL DEFAULT 'Under Review',
  status_color TEXT DEFAULT 'amber',
  review_comment TEXT,
  registered_by TEXT,
  reg_fee REAL DEFAULT 0,
  app_fee REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  total_due REAL DEFAULT 0,
  payment_receipt TEXT,
  uploaded_docs TEXT,
  doc_file_names TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  time TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system',
  unread INTEGER DEFAULT 1,
  time TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fines (
  id TEXT PRIMARY KEY,
  agency_id TEXT,
  agency_name TEXT,
  amount TEXT,
  reason TEXT,
  issued_by TEXT,
  date TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agency_changes (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT,
  requester TEXT,
  date TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invite_log (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT,
  region TEXT,
  invited_by TEXT,
  accepted_at TEXT,
  revoked_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('registrationFee', '1000');
INSERT OR IGNORE INTO settings (key, value) VALUES ('renewalFee', '600');
INSERT OR IGNORE INTO settings (key, value) VALUES ('applicationFee', '500');
INSERT OR IGNORE INTO settings (key, value) VALUES ('certificateTitle', 'TRAVEL AGENCY LICENSE');
INSERT OR IGNORE INTO settings (key, value) VALUES ('certificateSubtitle', 'Ministry of Civil Aviation and Airport Development');
