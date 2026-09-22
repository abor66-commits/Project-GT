// prisma/seed.js - Run after first deployment to create initial admin
// Usage: node prisma/seed.js
const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.resolve(process.cwd(), 'dev.db');

const db = new Database(dbPath);

// Check if admin exists
const existing = db.prepare("SELECT id FROM User WHERE role = 'ADMIN' LIMIT 1").get();

if (!existing) {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO User (id, name, email, password, role, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'ADMIN', 'APPROVED', ?, ?)
  `).run(id, 'System Admin', 'admin@grandtechcloud.com', 'admin123', now, now);
  console.log('✅ Admin user created: admin@grandtechcloud.com / admin123');
  console.log('⚠️  Please change the password after first login!');
} else {
  console.log('ℹ️  Admin user already exists, skipping seed.');
}

db.close();
