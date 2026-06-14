import crypto from 'crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const PREFIX = 'scrypt';

const deriveScrypt = (plain: string, salt: Buffer, keylen: number, options: crypto.ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(plain, salt, keylen, options, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });

export const isHashedPassword = (stored: string | undefined | null): boolean =>
  typeof stored === 'string' && stored.startsWith(`${PREFIX}$`);

export const hashPassword = async (plain: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  const derived = await deriveScrypt(plain, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return [PREFIX, SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('hex'), derived.toString('hex')].join('$');
};

export const verifyPassword = async (plain: string, stored: string | undefined | null): Promise<boolean> => {
  if (!stored) {
    return false;
  }
  if (!isHashedPassword(stored)) {
    // 兼容历史明文密码
    return plain === stored;
  }

  const parts = stored.split('$');
  if (parts.length !== 6) {
    return false;
  }
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length === 0) {
    return false;
  }
  const derived = await deriveScrypt(plain, salt, expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
  });
  if (derived.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
};
