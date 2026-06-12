import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  listFs: vi.fn(),
  loginWithHashedPassword: vi.fn(),
  getUserAccountConfigs: vi.fn(),
}));

vi.mock('../../../user/service/user-config.service', () => ({
  getUserAccountConfigs: mocked.getUserAccountConfigs,
}));

vi.mock('../../../../sdk/openlist', () => ({
  createOpenlistSdk: () => ({
    loginWithHashedPassword: mocked.loginWithHashedPassword,
    listFs: mocked.listFs,
  }),
}));

describe('listFormatConvertOpenlistFs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getUserAccountConfigs.mockResolvedValue({
      openlist: {
        baseUrl: 'https://openlist.example.com',
        username: 'demo',
        password: 'hashed-password',
      },
    });
    mocked.loginWithHashedPassword.mockResolvedValue(undefined);
    mocked.listFs.mockResolvedValue({
      total: 42,
      content: [
        {
          name: 'movie.mp4',
          size: 1024,
          is_dir: false,
          modified: '2026-06-12 10:00:00',
        },
      ],
    });
  });

  it('passes page params through and returns pagination metadata', async () => {
    const { listFormatConvertOpenlistFs } = await import('../format-convert-openlist.service');

    const result = await listFormatConvertOpenlistFs('u1', '/videos', 3, 50);

    expect(mocked.listFs).toHaveBeenCalledWith({
      path: '/videos',
      page: 3,
      perPage: 50,
      refresh: false,
    });
    expect(result).toMatchObject({
      path: '/videos',
      page: 3,
      perPage: 50,
      total: 42,
    });
  });
});
