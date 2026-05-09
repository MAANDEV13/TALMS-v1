// Generate PBKDF2 hash for admin seed user
// Run: node db/seed-admin.mjs

const crypto = await import('crypto');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) reject(err);
      resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}

const hash = await hashPassword('admin123');
const id = crypto.randomUUID();

const sql = `INSERT INTO users (id, email, name, password_hash, role, status) VALUES ('${id}', 'bromankah@gmail.com', 'Admin', '${hash}', 'admin', 'Active');`;

console.log('SQL to run:');
console.log(sql);

// Write to file for wrangler
const fs = await import('fs');
fs.writeFileSync('db/seed-admin.sql', sql);
console.log('\nSaved to db/seed-admin.sql');
