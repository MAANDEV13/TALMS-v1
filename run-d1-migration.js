// Run D1 migration via Cloudflare REST API
// Usage: node run-d1-migration.js
const fs = require('fs');
const path = require('path');

// Manual .env.local loader
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_D1_DB_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CF_ACCOUNT_ID || !CF_D1_DB_ID || !CF_API_TOKEN) {
  console.error('Missing environment variables. Ensure .env.local has:');
  console.error('  CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DB_ID}/query`;

async function runSQL(sql) {
  const res = await fetch(D1_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  const data = await res.json();
  if (!data.success) {
    console.error('❌ Failed:', JSON.stringify(data.errors, null, 2));
    return false;
  }
  return true;
}

async function main() {
  console.log('🔄 Running D1 migration: notifications table...\n');

  const sql = `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    role TEXT,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'system',
    link TEXT,
    unread INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`;

  const success = await runSQL(sql);
  if (success) {
    console.log('✅ notifications table created successfully!\n');
  }

  // Verify table exists
  const verifyRes = await fetch(D1_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" }),
  });
  const verifyData = await verifyRes.json();
  if (verifyData.success) {
    const tables = verifyData.result?.[0]?.results?.map(r => r.name) || [];
    console.log('📋 Current D1 tables:', tables.join(', '));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
