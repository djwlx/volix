import { describe, expect, test } from 'vitest';
import { createScopedRuntimeMap } from '../../apps/api/src/modules/115/service/scoped-runtime-map';

describe('115 scoped runtime map', () => {
  test('evicts stale entries when reading active values', () => {
    const disposed: string[] = [];
    const store = createScopedRuntimeMap<string>({
      ttlMs: 1000,
      maxEntries: 10,
      dispose: (value, key) => {
        disposed.push(`${key}:${value}`);
      },
    });

    store.set('user-a', 'sdk-a', 1000);
    store.set('user-b', 'sdk-b', 1500);

    expect(store.get('user-a', 2500)).toBeUndefined();
    expect(store.get('user-b', 2500)).toBe('sdk-b');
    expect(disposed).toEqual(['user-a:sdk-a']);
    expect(store.size()).toBe(1);
  });

  test('evicts the oldest active entries when over the size limit', () => {
    const store = createScopedRuntimeMap<number>({
      ttlMs: 10_000,
      maxEntries: 2,
    });

    store.set('user-a', 1, 1000);
    store.set('user-b', 2, 1001);
    store.set('user-c', 3, 1002);

    expect(store.get('user-a', 1003)).toBeUndefined();
    expect(store.get('user-b', 1003)).toBe(2);
    expect(store.get('user-c', 1003)).toBe(3);
    expect(store.size()).toBe(2);
  });
});
