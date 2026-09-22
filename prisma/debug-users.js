const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.resolve(process.cwd(), 'dev.db');

console.log('🔍 Checking Database:', dbPath);

try {
  const db = new Database(dbPath);
  const users = db.prepare('SELECT email, password, role, status FROM User').all();
  
  console.log('\n--- 🔑 使用者帳號列表 ---');
  if (users.length === 0) {
    console.log('⚠️ 資料庫中沒有任何使用者！請先執行 node prisma/seed.js');
  } else {
    users.forEach((u, i) => {
      console.log(`${i + 1}. [${u.role}] ${u.email} - Password: ${u.password} (${u.status})`);
    });
  }
  console.log('------------------------\n');
  db.close();
} catch (e) {
  console.error('❌ 讀取失敗:', e.message);
}
