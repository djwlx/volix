import { beforeEach, describe, expect, test, vi } from 'vitest';

const getRandom115PicMetaMock = vi.fn();
const getRandom115PicFromCacheCidMetaMock = vi.fn();
const getRandomCacheConfigMock = vi.fn();

vi.mock('../../apps/api/src/modules/115/service/picture.service', () => ({
  clear115PicData: vi.fn(),
  getLiked115PicListData: vi.fn(),
  get115PicCacheFileByPcData: vi.fn(),
  get115PicInfoData: vi.fn(),
  get115PicPathByPcData: vi.fn(),
  get115RandomPicCacheFileData: vi.fn(),
  getRandom115PicFromCacheCidMeta: getRandom115PicFromCacheCidMetaMock,
  getRandom115PicFromParentMeta: vi.fn(),
  getRandom115PicMeta: getRandom115PicMetaMock,
  like115PicData: vi.fn(),
  retry115PicData: vi.fn(),
  set115PicInfoData: vi.fn(),
  set115PicRandomCacheConfigData: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-random-core', async importOriginal => {
  const actual = await importOriginal<
    typeof import('../../apps/api/src/modules/115/service/picture/picture-cache-random-core')
  >();
  return {
    ...actual,
    getRandomCacheConfig: getRandomCacheConfigMock,
  };
});

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: vi.fn(),
  get115FileListData: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/qrcode.service', () => ({
  get115QrCodeData: vi.fn(),
  get115QrCodeStatusData: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/session.service', () => ({
  exit115AndClearCookie: vi.fn(),
  login115WithAppAndSaveCookie: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/user.service', () => ({
  get115UserInfoData: vi.fn(),
}));

describe('115 random pic controller', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getRandomCacheConfigMock.mockResolvedValue({
      sourceWeights: {
        memory: 0,
        local: 50,
        cloud: 50,
      },
      memoryMaxSizeMb: 100,
      localMaxSizeMb: 2048,
      randomNoRepeatWindowMinutes: 5,
      randomNoRepeatMaxCount: 50,
      cloudProxyUrl: '',
      autoPlayIntervalSeconds: 12,
    });
    getRandom115PicMetaMock.mockResolvedValue({
      url: 'https://img.example.com/01.jpg',
      fileName: '01.jpg',
      cid: 'cid-1',
      pc: 'pc-1',
      path: '/Root/Album A/01.jpg',
      parentPath: '/Root/Album A',
      liked: false,
      notice: undefined,
    });
    getRandom115PicFromCacheCidMetaMock.mockResolvedValue({
      url: 'https://img.example.com/cache-01.jpg',
      fileName: 'cache-01.jpg',
      cid: 'cache-cid-1',
      pc: 'cache-pc-1',
      path: '/Root/Cache Folder/cache-01.jpg',
      parentPath: '/Root/Cache Folder',
      liked: false,
      notice: undefined,
    });
  });

  test('returns auto-play interval in random pic json response', async () => {
    const { getRandom115Pic } = await import('../../apps/api/src/modules/115/controller/115.controller');

    const result = await getRandom115Pic({
      query: {
        mode: 'json',
      },
      request: {
        headers: {},
      },
    } as never);

    expect(result).toMatchObject({
      url: 'https://img.example.com/01.jpg',
      autoPlayIntervalSeconds: 12,
    });
  });

  test('returns cache-folder random pic json response for the provided cid', async () => {
    const { getRandom115PicByCacheCid } = await import('../../apps/api/src/modules/115/controller/115.controller');

    const result = await getRandom115PicByCacheCid({
      query: {
        cid: 'cache-cid-1',
      },
      request: {
        headers: {
          'user-agent': 'jest-agent',
        },
      },
    } as never);

    expect(getRandom115PicFromCacheCidMetaMock).toHaveBeenCalledWith({
      cid: 'cache-cid-1',
      userAgent: 'jest-agent',
    });
    expect(result).toMatchObject({
      url: 'https://img.example.com/cache-01.jpg',
      cid: 'cache-cid-1',
      pc: 'cache-pc-1',
      path: '/Root/Cache Folder/cache-01.jpg',
      autoPlayIntervalSeconds: 12,
    });
  });
});
