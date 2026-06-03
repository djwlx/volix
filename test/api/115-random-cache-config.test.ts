import { beforeEach, describe, expect, test, vi } from 'vitest';

const getConfigMock = vi.fn();
const setConfigMock = vi.fn();

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: getConfigMock,
  setConfig: setConfigMock,
}));

describe('115 random cache config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getConfigMock.mockResolvedValue(null);
    setConfigMock.mockResolvedValue(undefined);
  });

  test('returns default auto-play interval when config is missing', async () => {
    const { getRandomCacheConfig } = await import(
      '../../apps/api/src/modules/115/service/picture/picture-cache-random-core'
    );

    const result = await getRandomCacheConfig();

    expect(result.autoPlayIntervalSeconds).toBe(10);
  });

  test('clamps auto-play interval into the supported range when saving config', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_random_weights: JSON.stringify({
        autoPlayIntervalSeconds: 10,
      }),
    });

    const { setRandomCacheConfig } = await import(
      '../../apps/api/src/modules/115/service/picture/picture-cache-random-core'
    );

    await setRandomCacheConfig({
      autoPlayIntervalSeconds: 99999,
    });

    expect(setConfigMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"autoPlayIntervalSeconds":3600')
    );
  });
});
