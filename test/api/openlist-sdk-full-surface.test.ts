import { describe, expect, it, vi } from 'vitest';

const requestMock = vi.fn();

vi.mock('../../apps/api/src/utils/request', () => ({
  default: requestMock,
}));

describe('openlist sdk full surface', () => {
  it('maps grouped helpers to stable request configs', async () => {
    requestMock.mockResolvedValue({ data: { code: 200, message: 'ok', data: {} } });

    const { createOpenlistSdk } = await import('../../apps/api/src/sdk/openlist');
    const sdk = createOpenlistSdk({
      apiHost: 'https://openlist.example.com',
      token: 'Bearer token',
      minRequestIntervalMs: 0,
    });

    await sdk.searchFs({ parent: '/movies', keywords: 'demo' });
    await sdk.getDirectoryTree({ path: '/movies' });
    await sdk.uploadFileByStream({
      path: '/目标 目录',
      stream: {} as NodeJS.ReadableStream,
      filename: '演示 视频.mp4',
    });
    await sdk.listUsers({ page: 1, perPage: 20 });
    await sdk.getOfflineDownloadTools();
    await sdk.createShare({ path: '/movies/a.mp4', password: '' });

    expect(requestMock).toHaveBeenCalledTimes(6);
    expect(requestMock.mock.calls.map(call => [call[0].method, call[0].url])).toEqual([
      ['POST', '/api/fs/search'],
      ['POST', '/api/fs/dirs'],
      ['PUT', '/api/fs/put'],
      ['GET', '/api/admin/user/list'],
      ['GET', '/api/public/offline_download_tools'],
      ['POST', '/api/share/create'],
    ]);
    expect(requestMock.mock.calls[2][0].headers['File-Path']).toBe(encodeURI('/目标 目录/演示 视频.mp4'));
  });
});
