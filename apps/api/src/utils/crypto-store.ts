import crypto from 'crypto';
import { getEncryptionKey } from './secrets';

const PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';

export const isEncryptedSecret = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(PREFIX);

export const encryptSecret = (plain: string): string => {
  if (typeof plain !== 'string' || plain.length === 0) {
    return plain;
  }
  if (isEncryptedSecret(plain)) {
    return plain;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

export const decryptSecret = (stored: string | undefined | null): string => {
  if (!stored) {
    return '';
  }
  if (!isEncryptedSecret(stored)) {
    // 兼容历史明文
    return stored;
  }
  try {
    const [ivPart, tagPart, dataPart] = stored.slice(PREFIX.length).split(':');
    const iv = Buffer.from(ivPart, 'base64');
    const tag = Buffer.from(tagPart, 'base64');
    const data = Buffer.from(dataPart, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
};
