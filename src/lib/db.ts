import { PrismaClient } from './generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

import fs from 'fs';

// Use DATABASE_URL env var (for Railway) or fall back to local dev.db
let dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.resolve(process.cwd(), 'dev.db');

// Ensure the parent directory of the database file exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('[Prisma Init] Created missing database directory:', dbDir);
  } catch (err) {
    console.warn('[Prisma Init] Failed to create database directory, falling back to local dev.db:', err);
    dbPath = path.resolve(process.cwd(), 'dev.db');
  }
}

const connectionConfig = {
  url: `file:${dbPath}`
};

console.log('[Prisma Init] Connecting to:', dbPath);
console.log('[Prisma Init] File exists:', fs.existsSync(dbPath));

let prisma: PrismaClient;

try {
  console.log('[Prisma Init] Attempting to initialize Prisma with adapter...');
  const adapter = new PrismaBetterSqlite3(connectionConfig);
  
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter,
    });
    
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  console.log('[Prisma Init] Prisma Client initialized successfully.');
} catch (error) {
  console.error('[Prisma Init] FAILED to initialize Prisma:', error);
  // Fallback to standard PrismaClient without adapter if it fails
  // (though it might still fail if it's a native binary issue)
  prisma = new PrismaClient();
}

export { prisma };
