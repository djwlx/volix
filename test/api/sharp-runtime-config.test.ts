import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('sharp runtime config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('applies low-memory sharp defaults', async () => {
    const cacheMock = vi.fn();
    const concurrencyMock = vi.fn();

    const { configureSharpRuntime } = await import('../../apps/api/src/utils/sharp-runtime');
    configureSharpRuntime({
      cache: cacheMock,
      concurrency: concurrencyMock,
    } as never);

    expect(cacheMock).toHaveBeenCalledWith({
      memory: 16,
      files: 0,
      items: 8,
    });
    expect(concurrencyMock).toHaveBeenCalledWith(1);
  });

  test('allows env overrides for sharp memory limits', async () => {
    const cacheMock = vi.fn();
    const concurrencyMock = vi.fn();

    const { configureSharpRuntime } = await import('../../apps/api/src/utils/sharp-runtime');
    configureSharpRuntime(
      {
        cache: cacheMock,
        concurrency: concurrencyMock,
      } as never,
      {
        SHARP_CACHE_MEMORY_MB: '24',
        SHARP_CACHE_ITEMS: '12',
        SHARP_CONCURRENCY: '2',
      }
    );

    expect(cacheMock).toHaveBeenCalledWith({
      memory: 24,
      files: 0,
      items: 12,
    });
    expect(concurrencyMock).toHaveBeenCalledWith(2);
  });
});
