import { beforeEach, describe, expect, test, vi } from 'vitest';

const getConfiguredRandomPicOptionsMock = vi.fn();
const isEnabledQueryFlagMock = vi.fn();
const isSelfReferencingRandomPicEndpointMock = vi.fn();
const buildRemoteEndpointUrlMock = vi.fn();
const getRemoteRandomPicMetaMock = vi.fn();
const toRandomPicResponseUrlMock = vi.fn();
const getRandom115PicMetaMock = vi.fn();

vi.mock('../../apps/api/src/modules/115/controller/115-random-proxy', () => ({
  buildRemoteEndpointUrl: buildRemoteEndpointUrlMock,
  buildRemoteParentRandomEndpoint: vi.fn(),
  buildRemotePicPathEndpoint: vi.fn(),
  getConfiguredRandomPicOptions: getConfiguredRandomPicOptionsMock,
  getRemoteRandomPicMeta: getRemoteRandomPicMetaMock,
  isEnabledQueryFlag: isEnabledQueryFlagMock,
  isSelfReferencingRandomPicEndpoint: isSelfReferencingRandomPicEndpointMock,
  parseRemotePicPathPayload: vi.fn(),
  toRandomPicResponseUrl: toRandomPicResponseUrlMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture.service', () => ({
  clear115PicData: vi.fn(),
  getLiked115PicListData: vi.fn(),
  get115PicCacheFileByPcData: vi.fn(),
  get115PicInfoData: vi.fn(),
  get115PicPathByPcData: vi.fn(),
  get115RandomPicCacheFileData: vi.fn(),
  getRandom115PicFromParentMeta: vi.fn(),
  getRandom115PicMeta: getRandom115PicMetaMock,
  like115PicData: vi.fn(),
  retry115PicData: vi.fn(),
  set115PicInfoData: vi.fn(),
  set115PicRandomCacheConfigData: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-random-core', () => ({
  getLocalRandomPicCacheByPc: vi.fn(),
  getPicCachePublicUrl: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: vi.fn(),
  get115FileListData: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115ByPc: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-fs-folder', () => ({
  ensureRandomLocalPicCacheByFileAsync: vi.fn(),
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
    getConfiguredRandomPicOptionsMock.mockResolvedValue({
      endpoint: '',
      localProxyEnabled: false,
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
    isEnabledQueryFlagMock.mockReturnValue(false);
    isSelfReferencingRandomPicEndpointMock.mockReturnValue(false);
    toRandomPicResponseUrlMock.mockImplementation((url: string) => url);
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
});
