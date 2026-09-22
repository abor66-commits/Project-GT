import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'gcs-crm-default-session-secret-change-me-in-production';

/**
 * 哈希密碼 (PBKDF2)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 驗證密碼（支援舊系統明文密碼相容模式）
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash.includes(':')) {
    // 舊系統明文密碼比對
    return storedHash === password;
  }
  const [salt, hash] = storedHash.split(':');
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === testHash;
}

/**
 * 簽名 Session Cookie
 */
export function signSession(email: string): string {
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(email).digest('hex');
  return `${email}|${signature}`;
}

/**
 * 驗證並解析 Session Cookie
 */
export function verifySession(token: string): string | null {
  const parts = token.split('|');
  if (parts.length !== 2) return null;
  const [email, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(email).digest('hex');
  if (signature === expectedSignature) {
    return email;
  }
  return null;
}
