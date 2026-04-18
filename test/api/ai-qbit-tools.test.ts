import { AppConfigEnum } from '../../apps/api/src/modules/config/model/config.model';
import { buildQbitInternalTools } from '../../apps/api/src/modules/ai/service/ai-internal-tool-builtins/qbit-tools';

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: vi.fn(async () => ({
    [AppConfigEnum.account_qbittorrent]: JSON.stringify({
      baseUrl: 'https://qbit.example',
      username: 'admin',
      password: 'secret',
    }),
  })),
}));

vi.mock('../../apps/api/src/sdk', () => ({
  createQbittorrentSdk: vi.fn(() => ({
    getTorrentList: vi.fn(async () => [
      {
        hash: 'a',
        name: 'done',
        progress: 1,
        state: 'uploading',
        size: 1,
        dlspeed: 0,
        upspeed: 0,
        added_on: 0,
        completion_on: 0,
        save_path: '/done',
        category: '',
        tags: '',
      },
      {
        hash: 'b',
        name: 'downloading',
        progress: 0.5,
        state: 'downloading',
        size: 1,
        dlspeed: 100,
        upspeed: 0,
        added_on: 0,
        completion_on: 0,
        save_path: '/dl',
        category: '',
        tags: '',
      },
    ]),
    deleteTorrents: vi.fn(async () => 'ok'),
  })),
}));

describe('ai qbit tools', () => {
  test('qbit list tool returns torrents without leaking credentials', async () => {
    const tool = buildQbitInternalTools().find(item => item.name === 'qbit.get_torrent_list');
    const result = await tool!.execute(
      {
        user: { id: '1', role: 'admin' as any },
      },
      {}
    );

    expect(result.internalResult).toMatchObject([{ name: 'done' }, { name: 'downloading' }]);
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});
