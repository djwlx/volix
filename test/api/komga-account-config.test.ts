import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountConfigPlatform } from '../../packages/types/src/api';

const mocked = vi.hoisted(() => ({
  createKomgaSdk: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../../apps/api/src/sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('../../apps/api/src/sdk')>();
  return {
    ...actual,
    createKomgaSdk: mocked.createKomgaSdk,
  };
});

describe('komga account config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getCurrentUser.mockResolvedValue({ email: 'demo@example.com' });
    mocked.createKomgaSdk.mockReturnValue({
      getCurrentUser: mocked.getCurrentUser,
    });
  });

  it('normalizes api key based komga config', async () => {
    const { normalizeKomgaAccountConfig } = await import('../../apps/api/src/modules/user/service/user-config.service');

    expect(
      normalizeKomgaAccountConfig({
        baseUrl: 'https://komga.example.com/',
        apiKey: 'secret-key',
      })
    ).toEqual({
      baseUrl: 'https://komga.example.com/',
      apiKey: 'secret-key',
    });
  });

  it('normalizes username and password based komga config', async () => {
    const { normalizeKomgaAccountConfig } = await import('../../apps/api/src/modules/user/service/user-config.service');

    expect(
      normalizeKomgaAccountConfig({
        baseUrl: 'https://komga.example.com',
        username: 'reader',
        password: 'pass',
      })
    ).toEqual({
      baseUrl: 'https://komga.example.com',
      username: 'reader',
      password: 'pass',
    });
  });

  it('rejects komga config without auth credentials', async () => {
    const { normalizeKomgaAccountConfig } = await import('../../apps/api/src/modules/user/service/user-config.service');

    expect(() =>
      normalizeKomgaAccountConfig({
        baseUrl: 'https://komga.example.com',
      })
    ).toThrowError();
  });

  it('tests komga connection through current user endpoint', async () => {
    const { testAccountConfig } = await import('../../apps/api/src/modules/user/controller/account-config.controller');

    await expect(
      testAccountConfig({
        state: {
          userInfo: {
            id: 1,
          },
        },
        request: {
          headers: {
            'user-agent': 'volix-test',
          },
          body: {
            platform: AccountConfigPlatform.KOMGA,
            config: {
              baseUrl: 'https://komga.example.com',
              apiKey: 'secret-key',
            },
          },
        },
      } as never)
    ).resolves.toMatchObject({
      success: true,
    });

    expect(mocked.createKomgaSdk).toHaveBeenCalledWith({
      baseUrl: 'https://komga.example.com',
      apiKey: 'secret-key',
      password: undefined,
      userAgent: 'volix-test',
      username: undefined,
    });
    expect(mocked.getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
