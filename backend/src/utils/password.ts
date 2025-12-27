import crypto from 'crypto';

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  const dk = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return dk.toString('hex');
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const h = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(expectedHash, 'hex'));
}
