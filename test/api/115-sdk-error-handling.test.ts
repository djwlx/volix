import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
  },
  secret: {
    encode: vi.fn(),
    decode: vi.fn(),
  },
  fileService: {
    get115FileData: vi.fn(),
  },
  fileDbService: {
    getFile115ByPc: vi.fn(),
    setFile115LocalCacheFileNameByPc: vi.fn(),
    setFile115List: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  configService: {
    clearConfig: vi.fn(),
    getConfig: vi.fn(),
    setConfig: vi.fn(),
  },
  requestContext: {
    getRequestActingUserId: vi.fn(() => 'public'),
  },
  randomCore: {
    DEFAULT_115_DOWNLOAD_UA: 'test-ua',
    DEFAULT_FILE_NAME: 'unknown.jpg',
    DEFAULT_MIME_TYPE: 'application/octet-stream',
    clearLocalRandomPicCacheByPc: vi.fn(),
    getLikedPicCacheDir: vi.fn(() => '/tmp/115-liked'),
    getLocalRandomPicCacheByPc: vi.fn(),
    getLocalRandomPicCacheFileList: vi.fn(),
    getOriginFileNameFromLocalCacheFileName: vi.fn(),
    getPicCacheFileName: vi.fn((pc: string, name: string) => `${pc}.${name}`),
    getPicCacheFilePath: vi.fn((name: string) => `/tmp/115-liked/${name}`),
    getPicCachePublicUrl: vi.fn((pc: string) => `/api/115/pic/cache/${pc}`),
    getRandomCacheConfig: vi.fn(),
    getRandomPicCacheMetaFile: vi.fn(() => '/tmp/115-random/meta.json'),
    getRandomPicCacheDir: vi.fn(() => '/tmp/115-random'),
    getRandomPicCacheFilePath: vi.fn((name: string) => `/tmp/115-random/${name}`),
    getRandomPicCachePublicUrl: vi.fn((name: string) => `/api/115/pic/random-cache/${name}`),
    likeCacheDownloadJobMap: new Map<string, Promise<unknown>>(),
    parsePcFromLocalCacheFileName: vi.fn(),
    randomCacheDownloadJobMap: new Map<string, Promise<unknown>>(),
    sanitizeCacheFileName: vi.fn((name: string) => name),
    setRandomCacheMetaByPc: vi.fn(),
  },
  pictureUnified: {
    evictUnifiedPicCacheToFit: vi.fn(),
    getUnifiedPicCacheUsage: vi.fn(),
  },
}));

vi.mock('../../apps/api/src/utils/request', () => ({
  default: mocked.request,
}));

vi.mock('../../apps/api/src/sdk/115/secret', () => ({
  secret: mocked.secret,
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: mocked.fileService.get115FileData,
}));

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115ByPc: mocked.fileDbService.getFile115ByPc,
  setFile115LocalCacheFileNameByPc: mocked.fileDbService.setFile115LocalCacheFileNameByPc,
  setFile115List: mocked.fileDbService.setFile115List,
}));

vi.mock('../../apps/api/src/utils/logger', () => ({
  log: mocked.logger,
  baseLog: mocked.logger,
}));

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  clearConfig: mocked.configService.clearConfig,
  getConfig: mocked.configService.getConfig,
  setConfig: mocked.configService.setConfig,
}));

vi.mock('../../apps/api/src/utils/request-context', () => ({
  getRequestActingUserId: mocked.requestContext.getRequestActingUserId,
}));

vi.mock('../../apps/api/src/modules/config/model/config.model', () => ({
  AppConfigEnum: {
    picture_115_folders: 'picture_115_folders',
  },
}));

vi.mock('../../apps/api/src/modules/shared/http-handler', () => ({
  badRequest(message: string) {
    throw new Error(message);
  },
}));

vi.mock('../../apps/api/src/utils/date', () => ({
  calculateTimeDifference: vi.fn(),
  waitTime: vi.fn(),
}));

vi.mock('../../apps/api/src/utils/light-lock', () => ({
  lightLocks: {},
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-random-core', () => mocked.randomCore);

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-unified', () => mocked.pictureUnified);

describe('115 sdk error handling', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocked.randomCore.likeCacheDownloadJobMap.clear();
    mocked.randomCore.randomCacheDownloadJobMap.clear();
  });

  test('throws an explicit error when 115 returns a non-json download payload', async () => {
    mocked.secret.encode.mockReturnValue({
      data: 'encoded-payload',
      key: [1, 2, 3],
    });
    mocked.request.post.mockResolvedValue({
      data: {
        data: 'encrypted-response',
      },
    });
    mocked.secret.decode.mockReturnValue('^^^^');

    const { Cloud115InvalidDownloadPayloadError, create115Sdk } = await import(
      '../../apps/api/src/sdk/115/create-115.sdk'
    );

    const sdk = create115Sdk({ cookie: 'UID=test' });
    const promise = sdk.getFile('pc-1', 'agent-a');

    await expect(promise).rejects.toBeInstanceOf(Cloud115InvalidDownloadPayloadError);
    await expect(promise).rejects.toMatchObject({
      code: 'CLOUD115_INVALID_DOWNLOAD_PAYLOAD',
      payloadSnippet: '^^^^',
    });
  });

  test('downgrades invalid 115 payload errors to warn logs during liked-cache prewarm', async () => {
    mocked.fileDbService.getFile115ByPc.mockResolvedValue(undefined);

    const { Cloud115InvalidDownloadPayloadError } = await import('../../apps/api/src/sdk/115/create-115.sdk');
    mocked.fileService.get115FileData.mockRejectedValue(
      new Cloud115InvalidDownloadPayloadError('115 返回了无法解析的下载信息', {
        payloadSnippet: '^^^^',
      })
    );

    const { ensureLocalPicCacheByFileAsync } = await import(
      '../../apps/api/src/modules/115/service/picture/picture-cache-fs-folder'
    );

    await ensureLocalPicCacheByFileAsync(
      {
        class: '',
        cid: 'cid-1',
        fullPath: '/Root/Album A/01.jpg',
        isLiked: true,
        localCacheFileName: '',
        parentCid: 'parent-cid',
        pc: 'pc-1',
      },
      'agent-b'
    );

    expect(mocked.logger.warn).toHaveBeenCalled();
    expect(mocked.logger.error).not.toHaveBeenCalled();
  });
});
