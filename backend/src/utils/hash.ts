import crypto from 'crypto';

export function deterministicHash(input: string): number {
  const h = crypto.createHash('sha256').update(input).digest();
  // Convert first 8 bytes to a 64-bit number and map to [0,1)
  const num = h.readUInt32BE(0) ^ h.readUInt32BE(4);
  return num / 0xffffffff; // 0..1
}
