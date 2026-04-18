import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('../../apps/api/src/utils/request', () => ({
  default: mocked.request,
}));

import { createBangumiSdk } from '../../apps/api/src/sdk';

describe('bangumi sdk', () => {
  beforeEach(() => {
    mocked.request.mockReset();
  });

  test('uses browser user agent and bearer token when requesting myself', async () => {
    mocked.request.mockResolvedValue({
      data: {
        username: 'test-user',
      },
    });

    const sdk = createBangumiSdk({
      apiHost: 'https://api.bgm.tv',
      accessToken: 'bangumi-token',
      userAgent: 'Mozilla/5.0 Test Browser',
    });

    const result = await sdk.getMyself();

    expect(result).toMatchObject({ username: 'test-user' });
    expect(mocked.request).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.bgm.tv',
        url: '/v0/me',
        headers: expect.objectContaining({
          Authorization: 'Bearer bangumi-token',
          'User-Agent': 'Mozilla/5.0 Test Browser',
        }),
      })
    );
  });

  test('falls back to default user agent when caller does not provide one', async () => {
    mocked.request.mockResolvedValue({
      data: {
        username: 'fallback-user',
      },
    });

    const sdk = createBangumiSdk({
      apiHost: 'https://api.bgm.tv',
      accessToken: 'bangumi-token',
    });

    await sdk.getMyself();

    expect(mocked.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'djwl/volix',
        }),
      })
    );
  });

  test('supports subject search', async () => {
    mocked.request.mockResolvedValue({
      data: {
        data: [{ id: 1, name: '攻壳机动队' }],
      },
    });

    const sdk = createBangumiSdk({
      userAgent: 'Mozilla/5.0 Test Browser',
    });

    const result = await sdk.searchSubjects({ keyword: '攻壳' }, { limit: 10, offset: 0 });

    expect(result).toMatchObject({
      data: [{ id: 1, name: '攻壳机动队' }],
    });
    expect(mocked.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/v0/search/subjects',
        method: 'POST',
        params: { limit: 10, offset: 0 },
        data: { keyword: '攻壳' },
      })
    );
  });
});
