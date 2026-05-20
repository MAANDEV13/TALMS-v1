-- TALMS Database Migration: Add Notifications Table
-- Run this on your Cloudflare D1 database

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  role TEXT,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system',
  link TEXT,
  unread INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Add gr_serial column to applications if not exists
-- (D1 doesn't support ALTER IF NOT EXISTS, so this may error if column already exists)
-- ALTER TABLE applications ADD COLUMN gr_serial TEXT;

-- Add received_amount column to applications if not exists
-- ALTER TABLE applications ADD COLUMN received_amount REAL DEFAULT 0;
