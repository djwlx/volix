type ScopedRuntimeMapOptions<T> = {
  ttlMs: number;
  maxEntries: number;
  dispose?: (value: T, key: string) => void;
};

type ScopedRuntimeMapEntry<T> = {
  value: T;
  lastAccessAt: number;
};

export const createScopedRuntimeMap = <T>(options: ScopedRuntimeMapOptions<T>) => {
  const store = new Map<string, ScopedRuntimeMapEntry<T>>();

  const ttlMs = Math.max(0, Number(options.ttlMs || 0));
  const maxEntries = Math.max(1, Number(options.maxEntries || 1));

  const disposeEntry = (key: string, entry: ScopedRuntimeMapEntry<T>) => {
    store.delete(key);
    options.dispose?.(entry.value, key);
  };

  const cleanup = (now = Date.now()) => {
    if (ttlMs > 0) {
      for (const [key, entry] of store.entries()) {
        if (now - entry.lastAccessAt > ttlMs) {
          disposeEntry(key, entry);
        }
      }
    }

    const overflow = store.size - maxEntries;
    if (overflow <= 0) {
      return;
    }

    const oldestEntries = Array.from(store.entries())
      .sort((left, right) => left[1].lastAccessAt - right[1].lastAccessAt)
      .slice(0, overflow);

    for (const [key, entry] of oldestEntries) {
      disposeEntry(key, entry);
    }
  };

  const get = (key: string, now = Date.now()) => {
    cleanup(now);
    const entry = store.get(key);
    if (!entry) {
      return undefined;
    }
    entry.lastAccessAt = now;
    return entry.value;
  };

  const set = (key: string, value: T, now = Date.now()) => {
    cleanup(now);
    store.set(key, {
      value,
      lastAccessAt: now,
    });
    cleanup(now);
    return value;
  };

  return {
    cleanup,
    clear: () => {
      for (const [key, entry] of store.entries()) {
        disposeEntry(key, entry);
      }
    },
    delete: (key: string) => {
      const entry = store.get(key);
      if (!entry) {
        return false;
      }
      disposeEntry(key, entry);
      return true;
    },
    get,
    getOrCreate: (key: string, createValue: () => T, now = Date.now()) => {
      const existing = get(key, now);
      if (existing !== undefined) {
        return existing;
      }
      return set(key, createValue(), now);
    },
    set,
    size: () => store.size,
  };
};
