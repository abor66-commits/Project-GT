const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'test-results');
const destDir = '/Users/jacobchou/.gemini/antigravity-ide/brain/c9f5664d-6229-4be6-9c31-b91dabd7ea92';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log(`[Video Sync] Scanning source: ${srcDir}`);
console.log(`[Video Sync] Target destination: ${destDir}`);

function scanAndCopy(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Source directory does not exist: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanAndCopy(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.webm')) {
      // 依據父層資料夾名稱或路徑關鍵字判定情境
      let destName = '';
      const lowercasePath = fullPath.toLowerCase();

      if (lowercasePath.includes('activation')) {
        destName = '1_activation.webm';
      } else if (lowercasePath.includes('login')) {
        destName = '2_login.webm';
      } else if (lowercasePath.includes('create_customer') || lowercasePath.includes('create-customer')) {
        destName = '3_create_customer.webm';
      } else if (lowercasePath.includes('create_contact') || lowercasePath.includes('create-contact')) {
        destName = '4_create_contact.webm';
      } else if (lowercasePath.includes('ai_card_scan') || lowercasePath.includes('ai-card-scan')) {
        destName = '5_ai_card_scan.webm';
      } else if (lowercasePath.includes('tag_management') || lowercasePath.includes('tag-management')) {
        destName = '6_tag_management.webm';
      } else if (lowercasePath.includes('add_opportunity') || lowercasePath.includes('add-opportunity')) {
        destName = '7_add_opportunity.webm';
      } else if (lowercasePath.includes('email_broadcast') || lowercasePath.includes('email-broadcast')) {
        destName = '8_email_broadcast.webm';
      }

      if (destName) {
        const destPath = path.join(destDir, destName);
        fs.copyFileSync(fullPath, destPath);
        console.log(`✅ Successfully copied & renamed:\n   From: ${fullPath}\n   To: ${destPath}`);
      } else {
        console.log(`⚠️ Ignored webm file (no matching pattern): ${fullPath}`);
      }
    }
  }
}

scanAndCopy(srcDir);
console.log('[Video Sync] Completed.');
