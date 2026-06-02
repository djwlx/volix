type SharpRuntimeConfigTarget = {
  cache: (options: { memory: number; files: number; items: number }) => unknown;
  concurrency: (value: number) => unknown;
};

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
};

export const configureSharpRuntime = (
  sharpLib: SharpRuntimeConfigTarget,
  env: Record<string, string | undefined> = process.env
) => {
  const memory = toPositiveInt(env.SHARP_CACHE_MEMORY_MB, 16);
  const items = toPositiveInt(env.SHARP_CACHE_ITEMS, 8);
  const concurrency = toPositiveInt(env.SHARP_CONCURRENCY, 1);

  sharpLib.cache({
    memory,
    files: 0,
    items,
  });
  sharpLib.concurrency(concurrency);
};
