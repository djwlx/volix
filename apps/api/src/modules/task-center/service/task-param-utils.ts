export const normalizeUmoList = (umos: unknown): string[] => {
  if (!Array.isArray(umos)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  umos.forEach(item => {
    const value = String(item || '').trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  });
  return result;
};
