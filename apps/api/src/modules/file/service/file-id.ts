import crypto from 'crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = BigInt(ALPHABET.length);

// 默认 12 字节 = 96bit 熵，免鉴权访问下足以抗枚举/猜测
export const generateFileId = (byteLength = 12): string => {
  const bytes = crypto.randomBytes(byteLength);
  let value = BigInt('0x' + bytes.toString('hex'));
  if (value === 0n) {
    return ALPHABET[0];
  }
  let out = '';
  while (value > 0n) {
    const remainder = Number(value % BASE);
    out = ALPHABET[remainder] + out;
    value /= BASE;
  }
  return out;
};

export const FILE_ID_REGEX = /^[0-9A-Za-z]{8,32}$/;

export const isValidFileId = (value: string): boolean => FILE_ID_REGEX.test(value);
