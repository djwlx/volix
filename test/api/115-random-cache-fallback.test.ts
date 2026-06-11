import { beforeEach, describe, expect, test, vi } from 'vitest';

const getFile115ByPcMock = vi.fn();
const get115FileDataMock = vi.fn();
const getLocalRandomPicCacheByPcMock = vi.fn();
const getLocalRandomPicCacheByFileNameMock = vi.fn();
const parsePcFromLocalCacheFileNameMock = vi.fn();
const sanitizeCacheFileNameMock = vi.fn();
const ensureRandomLocalPicCacheByFileMock = vi.fn();
const ensureRandomLocalPicCacheByFileAsyncMock = vi.fn();
const parse115FileMetaMock = vi.fn();

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115ByPc: getFile115ByPcMock,
  getFile115PathByPc: vi.fn(),
  getLikedFile115Count: vi.fn(),
  getLikedFile115List: vi.fn(),
  setFile115LikedByPc: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: get115FileDataMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-random-core', () => ({
  DEFAULT_115_DOWNLOAD_UA: 'test-ua',
  DEFAULT_FILE_NAME: 'unknown.jpg',
  DEFAULT_MIME_TYPE: 'application/octet-stream',
  getRandomCacheConfig: vi.fn().mockResolvedValue({
    cloudProxyUrl: '',
  }),
  getLocalRandomPicCacheByPc: getLocalRandomPicCacheByPcMock,
  getLocalRandomPicCacheByFileName: getLocalRandomPicCacheByFileNameMock,
  parsePcFromLocalCacheFileName: parsePcFromLocalCacheFileNameMock,
  sanitizeCacheFileName: sanitizeCacheFileNameMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-fs-folder', () => ({
  clearLocalPicCacheByPcFromFs: vi.fn(),
  ensureLocalPicCacheByFileAsync: vi.fn(),
  ensureRandomLocalPicCacheByFile: ensureRandomLocalPicCacheByFileMock,
  ensureRandomLocalPicCacheByFileAsync: ensureRandomLocalPicCacheByFileAsyncMock,
  getLocalPicCacheByFile: vi.fn(),
  getLocalPicCacheByPc: vi.fn(),
  getLocalPicCacheByPcFromFs: vi.fn(),
  parse115FileMeta: parse115FileMetaMock,
}));

describe('115 random-cache fallback', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    sanitizeCacheFileNameMock.mockImplementation((name: string) => name);
    parsePcFromLocalCacheFileNameMock.mockReturnValue('pc-1');
    getFile115ByPcMock.mockResolvedValue({
      pc: 'pc-1',
      cid: 'root-cid',
      fullPath: '/Root/Album A/01.jpg',
      isLiked: false,
      localCacheFileName: '',
    });
  });

  test('returns remote image and queues async rebuild when local random cache file was deleted', async () => {
    getLocalRandomPicCacheByFileNameMock.mockResolvedValue(null);
    ensureRandomLocalPicCacheByFileAsyncMock.mockReturnValue(new Promise(() => undefined));
    getLocalRandomPicCacheByPcMock.mockResolvedValue(null);
    get115FileDataMock.mockResolvedValue({ info: {} });
    parse115FileMetaMock.mockReturnValue({
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
    });

    const { get115RandomPicCacheFileData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await get115RandomPicCacheFileData('pc-1.01.jpg', 'agent-a');

    expect(ensureRandomLocalPicCacheByFileAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({ pc: 'pc-1' }),
      'agent-a'
    );
    expect(result).toMatchObject({
      kind: 'remote',
      pc: 'pc-1',
      url: 'https://img.example.com/01.jpg',
    });
    expect(ensureRandomLocalPicCacheByFileMock).not.toHaveBeenCalled();
  });

  test('falls back to remote image when local rebuild fails', async () => {
    getLocalRandomPicCacheByFileNameMock.mockResolvedValue(null);
    ensureRandomLocalPicCacheByFileAsyncMock.mockRejectedValue(new Error('cache rebuild failed'));
    getLocalRandomPicCacheByPcMock.mockResolvedValue(null);
    get115FileDataMock.mockResolvedValue({ info: {} });
    parse115FileMetaMock.mockReturnValue({
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
    });

    const { get115RandomPicCacheFileData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await get115RandomPicCacheFileData('pc-1.01.jpg', 'agent-b');

    expect(result).toMatchObject({
      kind: 'remote',
      pc: 'pc-1',
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
    });
    expect(ensureRandomLocalPicCacheByFileAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({ pc: 'pc-1' }),
      'agent-b'
    );
  });
});
