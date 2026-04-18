const SENSITIVE_KEY_PATTERN = /(password|cookie|token|apiKey|authorization|secret|sid)/i;

const SIGNED_QUERY_KEYS = new Set([
  'x-amz-algorithm',
  'x-amz-credential',
  'x-amz-date',
  'x-amz-expires',
  'x-amz-signedheaders',
  'x-amz-signature',
  'signature',
  'token',
  'pwd',
]);

const MASKED_VALUE = '******';

const sanitizeUrl = (value: string) => {
  try {
    const url = new URL(value);
    const keys = [...url.searchParams.keys()];
    for (const key of keys) {
      if (SIGNED_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return value;
  }
};

export const sanitizeInternalToolResult = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeInternalToolResult(item));
  }

  if (typeof value === 'string') {
    return /^https?:\/\//.test(value) ? sanitizeUrl(value) : value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      acc[key] = MASKED_VALUE;
      return acc;
    }
    acc[key] = sanitizeInternalToolResult(item);
    return acc;
  }, {});
};
