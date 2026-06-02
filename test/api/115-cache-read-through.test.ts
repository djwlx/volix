import { beforeEach, describe, expect, test, vi } from 'vitest';

const getFile115ByPcMock = vi.fn();
const get115FileDataMock = vi.fn();
const getLocalRandomPicCacheByPcMock = vi.fn();
const getLocalRandomPicCacheByFileNameMock = vi.fn();
const getLocalPicCacheByFileMock = vi.fn();
const getLocalPicCacheByPcFromFsMock = vi.fn();
const parsePcFromLocalCacheFileNameMock = vi.fn();
const sanitizeCacheFileNameMock = vi.fn();
const ensureRandomLocalPicCacheByFileMock = vi.fn();
const ensureRandomLocalPicCacheByFileAsyncMock = vi.fn();
const ensureLocalPicCacheByFileAsyncMock = vi.fn();
const parse115FileMetaMock = vi.fn();
const resolvePicCacheByFormatMock = vi.fn();

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
  getLocalRandomPicCacheByPc: getLocalRandomPicCacheByPcMock,
  getLocalRandomPicCacheByFileName: getLocalRandomPicCacheByFileNameMock,
  getPicCachePublicUrl: vi.fn((pc: string) => `/api/115/pic/cache/${pc}`),
  parsePcFromLocalCacheFileName: parsePcFromLocalCacheFileNameMock,
  sanitizeCacheFileName: sanitizeCacheFileNameMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-fs-folder', () => ({
  clearLocalPicCacheByPcFromFs: vi.fn(),
  ensureLocalPicCacheByFileAsync: ensureLocalPicCacheByFileAsyncMock,
  ensureRandomLocalPicCacheByFile: ensureRandomLocalPicCacheByFileMock,
  ensureRandomLocalPicCacheByFileAsync: ensureRandomLocalPicCacheByFileAsyncMock,
  getLocalPicCacheByFile: getLocalPicCacheByFileMock,
  getLocalPicCacheByPc: vi.fn(),
  getLocalPicCacheByPcFromFs: getLocalPicCacheByPcFromFsMock,
  parse115FileMeta: parse115FileMetaMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-format', () => ({
  clearWebpCacheByPc: vi.fn(),
  normalizePicCacheFormat: vi.fn((format?: string) => format || ''),
  normalizePicCacheFormatOptions: vi.fn((options?: { width?: string; quality?: string }) => options || {}),
  resolvePicCacheByFormat: resolvePicCacheByFormatMock,
}));

describe('115 cache read-through', () => {
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
    getLocalRandomPicCacheByFileNameMock.mockResolvedValue(null);
    getLocalRandomPicCacheByPcMock.mockResolvedValue(null);
    getLocalPicCacheByPcFromFsMock.mockResolvedValue(null);
    getLocalPicCacheByFileMock.mockResolvedValue(null);
    get115FileDataMock.mockResolvedValue({ info: {} });
    parse115FileMetaMock.mockReturnValue({
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
    });
    resolvePicCacheByFormatMock.mockImplementation(
      async ({ source }: { source: { filePath: string; fileName: string; mimeType: string } }) => source
    );
  });

  test('returns remote random-cache source immediately and schedules async rebuild when local file is missing', async () => {
    ensureRandomLocalPicCacheByFileAsyncMock.mockReturnValue(new Promise(() => undefined));

    const { get115RandomPicCacheFileData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await get115RandomPicCacheFileData('pc-1.01.jpg', 'agent-a');

    expect(result).toMatchObject({
      kind: 'remote',
      pc: 'pc-1',
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
    });
    expect(ensureRandomLocalPicCacheByFileAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({ pc: 'pc-1' }),
      'agent-a'
    );
    expect(ensureRandomLocalPicCacheByFileMock).not.toHaveBeenCalled();
  });

  test('returns remote pc-cache source immediately and schedules async local cache warmup on cache miss', async () => {
    ensureLocalPicCacheByFileAsyncMock.mockReturnValue(new Promise(() => undefined));

    const { get115PicCacheFileByPcData } = await import('../../apps/api/src/modules/115/service/picture/api-liked');
    const result = await get115PicCacheFileByPcData('pc-1', 'agent-b');

    expect(result).toMatchObject({
      kind: 'remote',
      pc: 'pc-1',
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
    });
    expect(ensureLocalPicCacheByFileAsyncMock).toHaveBeenCalledWith(expect.objectContaining({ pc: 'pc-1' }), 'agent-b');
  });
});
