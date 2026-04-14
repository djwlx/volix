import { isProbablyText } from '../shared';

export const tryDecodeBase64 = (value: string) => {
  const trimmed = value.trim().replace(/\s+/g, '');
  if (!trimmed || trimmed.length < 8 || trimmed.length % 4 !== 0) {
    return null;
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    return null;
  }

  try {
    const binary = window.atob(trimmed);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes).trim();

    if (!decoded || !isProbablyText(decoded)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

export const encodeBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
};
