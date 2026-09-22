// prisma/seed.js - Run after first deployment to create initial admin
// Usage: node prisma/seed.js
const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.resolve(process.cwd(), 'dev.db');

const db = new Database(dbPath);

// Check if admin@grandtech.com exists
const adminGrandTech = db.prepare("SELECT id FROM User WHERE email = 'admin@grandtech.com'").get();

if (!adminGrandTech) {
  const id = randomUUID();
  const now = new Date().toISOString();
  // Password GtCrm#26: 8 chars, uppercase, lowercase, digits, special char
  db.prepare(`
    INSERT INTO User (id, name, email, password, role, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'ADMIN', 'APPROVED', ?, ?)
  `).run(id, 'GrandTech Admin', 'admin@grandtech.com', 'GtCrm#26', now, now);
  console.log('✅ Admin user created: admin@grandtech.com / GtCrm#26');
} else {
  console.log('ℹ️  admin@grandtech.com already exists.');
}

db.close();
