import { beforeEach, describe, expect, test, vi } from 'vitest';

const getLikedFile115CountMock = vi.fn();
const getLikedFile115ListMock = vi.fn();
const getLocalPicCacheByFileMock = vi.fn();
const ensureLocalPicCacheByFileAsyncMock = vi.fn();
const get115FileDataMock = vi.fn();
const getPicCachePublicUrlMock = vi.fn((pc: string) => `/api/115/pic/cache/${encodeURIComponent(pc)}`);

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115ByPc: vi.fn(),
  getFile115PathByPc: vi.fn(),
  getLikedFile115Count: getLikedFile115CountMock,
  getLikedFile115List: getLikedFile115ListMock,
  setFile115LikedByPc: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: get115FileDataMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-random-core', () => ({
  DEFAULT_115_DOWNLOAD_UA: 'test-default-ua',
  DEFAULT_FILE_NAME: 'unknown.jpg',
  DEFAULT_MIME_TYPE: 'application/octet-stream',
  getLocalRandomPicCacheByPc: vi.fn(),
  getLocalRandomPicCacheByFileName: vi.fn(),
  getPicCachePublicUrl: getPicCachePublicUrlMock,
  parsePcFromLocalCacheFileName: vi.fn(),
  sanitizeCacheFileName: vi.fn((name: string) => name),
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-fs-folder', () => ({
  clearLocalPicCacheByPcFromFs: vi.fn(),
  ensureRandomLocalPicCacheByFile: vi.fn(),
  ensureLocalPicCacheByFileAsync: ensureLocalPicCacheByFileAsyncMock,
  getLocalPicCacheByFile: getLocalPicCacheByFileMock,
  getLocalPicCacheByPc: vi.fn(),
  getLocalPicCacheByPcFromFs: vi.fn(),
  parse115FileMeta: vi.fn(),
}));

describe('115 liked list service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getLikedFile115CountMock.mockResolvedValue(1);
    getLikedFile115ListMock.mockResolvedValue([
      {
        pc: 'pc-1',
        cid: 'cid-1',
        fullPath: '/Root/Album A/01.jpg',
        localCacheFileName: 'pc-1.01.jpg',
        isLiked: true,
      },
    ]);
  });

  test('returns cache url when local cache exists', async () => {
    getLocalPicCacheByFileMock.mockResolvedValue({
      pc: 'pc-1',
      filePath: '/tmp/pc-1.01.jpg',
      fileName: '01.jpg',
      mimeType: 'image/jpeg',
      url: '/api/115/pic/cache/pc-1',
    });

    const { getLiked115PicListData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await getLiked115PicListData({
      offset: 0,
      pageSize: 10,
    });

    expect(result.count).toBe(1);
    expect(result.data[0]).toMatchObject({
      pc: 'pc-1',
      cached: true,
      url: '/api/115/pic/cache/pc-1',
    });
    expect(ensureLocalPicCacheByFileAsyncMock).not.toHaveBeenCalled();
  });

  test('returns proxy url and queues cache build when local cache missing', async () => {
    getLocalPicCacheByFileMock.mockResolvedValue(undefined);

    const { getLiked115PicListData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await getLiked115PicListData(
      {
        offset: 0,
        pageSize: 10,
      },
      'test-user-agent'
    );

    expect(result.data[0]).toMatchObject({
      pc: 'pc-1',
      cached: false,
      url: '/api/115/pic/cache/pc-1',
    });
    expect(getPicCachePublicUrlMock).toHaveBeenCalledWith('pc-1');
    expect(get115FileDataMock).not.toHaveBeenCalled();
    expect(ensureLocalPicCacheByFileAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({ pc: 'pc-1' }),
      'test-user-agent'
    );
  });

  test('returns proxy url without waiting remote url resolution', async () => {
    getLocalPicCacheByFileMock.mockResolvedValue(undefined);

    const { getLiked115PicListData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await getLiked115PicListData(
      {
        offset: 0,
        pageSize: 10,
      },
      'test-user-agent'
    );

    expect(result.data[0]).toMatchObject({
      pc: 'pc-1',
      cached: false,
      url: '/api/115/pic/cache/pc-1',
    });
    expect(getPicCachePublicUrlMock).toHaveBeenCalledWith('pc-1');
    expect(get115FileDataMock).not.toHaveBeenCalled();
  });
});
