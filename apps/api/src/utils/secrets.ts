import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PATH } from './path';

const SECRET_FILE_MODE = 0o600;

const readOrCreatePersistedSecret = (fileName: string, byteLength: number): string => {
  const dataDir = PATH.data;
  const filePath = path.join(dataDir, fileName);
  try {
    const existing = fs.readFileSync(filePath, 'utf8').trim();
    if (existing) {
      return existing;
    }
  } catch {
    // 文件不存在或不可读，下面生成新的
  }

  const generated = crypto.randomBytes(byteLength).toString('hex');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, generated, { mode: SECRET_FILE_MODE });
  } catch {
    // 持久化失败时降级为进程内密钥（重启后会轮换）
  }
  return generated;
};

let cachedJwtSecret: string | undefined;

export const getJwtSecret = (): string => {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }
  const fromEnv = String(process.env.VOLIX_JWT_SECRET || '').trim();
  cachedJwtSecret = fromEnv || readOrCreatePersistedSecret('.secret-jwt', 48);
  return cachedJwtSecret;
};

let cachedEncryptionKey: Buffer | undefined;

export const getEncryptionKey = (): Buffer => {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }
  const fromEnv = String(process.env.VOLIX_ENCRYPTION_KEY || '').trim();
  const rawSecret = fromEnv || readOrCreatePersistedSecret('.secret-encryption', 32);
  cachedEncryptionKey = crypto.createHash('sha256').update(rawSecret).digest();
  return cachedEncryptionKey;
};
