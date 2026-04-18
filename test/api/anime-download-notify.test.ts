import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  createQbittorrentSdk: vi.fn(),
  getConfig: vi.fn(),
  getQbittorrentAccountConfig: vi.fn(),
  queryAnimeSubscriptionItemsByWhere: vi.fn(),
  updateAnimeSubscriptionItem: vi.fn(),
  runAnimePostProcess: vi.fn(),
  sendSmtpMail: vi.fn(),
}));

vi.mock('../../apps/api/src/sdk', () => ({
  createQbittorrentSdk: mocked.createQbittorrentSdk,
}));

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: mocked.getConfig,
}));

vi.mock('../../apps/api/src/modules/anime-subscription/service/anime-config.service', () => ({
  getQbittorrentAccountConfig: mocked.getQbittorrentAccountConfig,
}));

vi.mock('../../apps/api/src/modules/anime-subscription/service/anime-subscription.service', async importOriginal => {
  const actual = await importOriginal<
    typeof import('../../apps/api/src/modules/anime-subscription/service/anime-subscription.service')
  >();
  return {
    ...actual,
    queryAnimeSubscriptionItemsByWhere: mocked.queryAnimeSubscriptionItemsByWhere,
    updateAnimeSubscriptionItem: mocked.updateAnimeSubscriptionItem,
  };
});

vi.mock('../../apps/api/src/modules/anime-subscription/service/anime-post-process.service', () => ({
  runAnimePostProcess: mocked.runAnimePostProcess,
}));

vi.mock('../../apps/api/src/modules/user/service/email.service', () => ({
  sendSmtpMail: mocked.sendSmtpMail,
}));

import { syncAnimeDownloadStatus } from '../../apps/api/src/modules/anime-subscription/service/anime-download.service';

describe('anime organized mail notification', () => {
  beforeEach(() => {
    mocked.createQbittorrentSdk.mockReset();
    mocked.getConfig.mockReset();
    mocked.getQbittorrentAccountConfig.mockReset();
    mocked.queryAnimeSubscriptionItemsByWhere.mockReset();
    mocked.updateAnimeSubscriptionItem.mockReset();
    mocked.runAnimePostProcess.mockReset();
    mocked.sendSmtpMail.mockReset();
  });

  test('sends mail only after ai organize succeeds', async () => {
    mocked.getQbittorrentAccountConfig.mockResolvedValue({
      baseUrl: 'http://qbit.local',
      username: 'admin',
      password: 'secret',
    });
    mocked.createQbittorrentSdk.mockReturnValue({
      getTorrentList: vi.fn().mockResolvedValue([
        {
          hash: 'abc',
          progress: 1,
          completion_on: 1,
          state: 'uploading',
          name: 'My Anime - 03',
        },
      ]),
    });
    mocked.queryAnimeSubscriptionItemsByWhere.mockResolvedValue([
      {
        dataValues: {
          id: 1,
          rss_title: 'My Anime - 03',
          qbit_hash: 'abc',
          notify_email: 'me@example.com',
          season: 1,
          episode: 3,
        },
      },
    ]);
    mocked.runAnimePostProcess.mockResolvedValue({
      organized: true,
      stage: 'ai_organized',
      targetPath: '/anime/My Anime/S01/E03.mkv',
      copyMode: 'rename_to_target',
    });
    mocked.getConfig.mockResolvedValue({
      account_smtp: JSON.stringify({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'mailer',
        password: 'mailer-secret',
        fromEmail: 'noreply@example.com',
      }),
    });

    await syncAnimeDownloadStatus({ id: 1, name: 'My Anime' } as any);

    expect(mocked.runAnimePostProcess).toHaveBeenCalledTimes(1);
    expect(mocked.sendSmtpMail).toHaveBeenCalledTimes(1);
    expect(mocked.runAnimePostProcess.mock.invocationCallOrder[0]).toBeLessThan(
      mocked.sendSmtpMail.mock.invocationCallOrder[0]
    );
  });
});
