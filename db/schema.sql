CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'officer', 'director', 'general_director', 'regional_director'
  region TEXT, -- For regional directors
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
  alternate_name TEXT,
  alternate_phone TEXT,
  business_structure TEXT DEFAULT 'solo',
  issue_date TEXT,
  expiry_date TEXT,
  registered_by TEXT,
  docs TEXT,
  doc_file_data TEXT,
  print_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  agency TEXT NOT NULL,
  agency_id TEXT,
  region TEXT,
  district TEXT,
  business_structure TEXT DEFAULT 'solo',
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  alternate_name TEXT,
  alternate_phone TEXT,
  register_date TEXT,
  type TEXT, -- 'new' or 'renewal'
  status TEXT, -- 'pending', 'director_approved', 'approved', 'rejected'
  status_color TEXT,
  registered_by TEXT,
  reg_fee REAL,
  app_fee REAL,
  discount REAL,
  paid_amount REAL,
  total_due REAL,
  payment_receipt TEXT,
  uploaded_docs TEXT,
  doc_file_names TEXT,
  doc_file_data TEXT,
  gr_serial TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  ministry_name TEXT DEFAULT 'Ministry of Civil Aviation and Airport''s Development',
  department_name TEXT DEFAULT 'Department of Civil Aviation',
  director_name TEXT DEFAULT 'Director Name',
  director_title TEXT DEFAULT 'Director of Civil Aviation',
  registration_fee TEXT DEFAULT '200',
  registration_app_fee TEXT DEFAULT '50',
  renewal_fee TEXT DEFAULT '100',
  renewal_app_fee TEXT DEFAULT '50',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_invites (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  region TEXT,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agency_changes (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'edit' or 'delete'
  data TEXT, -- JSON of proposed changes
  requester TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  review_comment TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
