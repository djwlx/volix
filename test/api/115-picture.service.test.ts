import { beforeEach, describe, expect, test, vi } from 'vitest';

const getConfigMock = vi.fn();
const clearConfigMock = vi.fn();
const setConfigMock = vi.fn();
const getFile115ParentGroupByCidListMock = vi.fn();
const getFile115ByCidParentCidIndexMock = vi.fn();
const getFile115ByCidIndexMock = vi.fn();
const getFile115ByPcMock = vi.fn();
const getFile115ByCidAndParentCidMock = vi.fn();
const getFile115CachedParentCidSetByRootCidMock = vi.fn();
const getFile115RandomByCidListExcludePcMock = vi.fn();
const getFile115RandomByCidListMock = vi.fn();
const getFile115LenMock = vi.fn();
const getFile115CountByCidMock = vi.fn();
const getFile115CachedCidListMock = vi.fn();
const getFile115CachedFolderPathListMock = vi.fn();
const getLikedFile115CountMock = vi.fn();
const clearAllFile115Mock = vi.fn();
const clearFile115ByCidListMock = vi.fn();
const clearFile115ByFolderPathListMock = vi.fn();
const getFile115RootCidListByCidListMock = vi.fn();
const getFile115RootCidListByFolderPathListMock = vi.fn();
const getAllFile115LocalCacheFileNameListMock = vi.fn();
const getFile115LocalCacheFileNameListByCidListMock = vi.fn();
const getFile115LocalCacheFileNameListByFolderPathListMock = vi.fn();
const setFile115ListMock = vi.fn();
const get115FileDataMock = vi.fn();
const get115FileListDataMock = vi.fn();
const generateRandomNumberMock = vi.fn();
const getUnifiedPicCacheUsageMock = vi.fn();
const ensureUnifiedPicCacheWithinLimitMock = vi.fn();

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: getConfigMock,
  clearConfig: clearConfigMock,
  setConfig: setConfigMock,
}));

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115Len: getFile115LenMock,
  getFile115CountByCid: getFile115CountByCidMock,
  getFile115CachedCidList: getFile115CachedCidListMock,
  getFile115CachedFolderPathList: getFile115CachedFolderPathListMock,
  getLikedFile115Count: getLikedFile115CountMock,
  clearAllFile115: clearAllFile115Mock,
  clearFile115ByCidList: clearFile115ByCidListMock,
  clearFile115ByFolderPathList: clearFile115ByFolderPathListMock,
  getFile115RootCidListByCidList: getFile115RootCidListByCidListMock,
  getFile115RootCidListByFolderPathList: getFile115RootCidListByFolderPathListMock,
  getAllFile115LocalCacheFileNameList: getAllFile115LocalCacheFileNameListMock,
  getFile115LocalCacheFileNameListByCidList: getFile115LocalCacheFileNameListByCidListMock,
  getFile115LocalCacheFileNameListByFolderPathList: getFile115LocalCacheFileNameListByFolderPathListMock,
  setFile115List: setFile115ListMock,
  getFile115ParentGroupByCidList: getFile115ParentGroupByCidListMock,
  getFile115ByCidParentCidIndex: getFile115ByCidParentCidIndexMock,
  getFile115ByCidIndex: getFile115ByCidIndexMock,
  getFile115ByPc: getFile115ByPcMock,
  getFile115ByCidAndParentCid: getFile115ByCidAndParentCidMock,
  getFile115CachedParentCidSetByRootCid: getFile115CachedParentCidSetByRootCidMock,
  getFile115RandomByCidListExcludePc: getFile115RandomByCidListExcludePcMock,
  getFile115RandomByCidList: getFile115RandomByCidListMock,
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: get115FileDataMock,
  get115FileListData: get115FileListDataMock,
}));

vi.mock('../../apps/api/src/utils/number', () => ({
  generateRandomNumber: generateRandomNumberMock,
}));

vi.mock('../../apps/api/src/modules/115/service/picture/picture-cache-unified', () => ({
  getUnifiedPicCacheUsage: getUnifiedPicCacheUsageMock,
  ensureUnifiedPicCacheWithinLimit: ensureUnifiedPicCacheWithinLimitMock,
}));

describe('115 picture service random meta', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getConfigMock.mockResolvedValue(null);
    clearConfigMock.mockResolvedValue(undefined);
    setConfigMock.mockResolvedValue(undefined);
    getFile115LenMock.mockResolvedValue(0);
    getFile115CountByCidMock.mockResolvedValue({});
    getFile115CachedCidListMock.mockResolvedValue([]);
    getFile115CachedFolderPathListMock.mockResolvedValue([]);
    getLikedFile115CountMock.mockResolvedValue(0);
    clearAllFile115Mock.mockResolvedValue(0);
    clearFile115ByCidListMock.mockResolvedValue(0);
    clearFile115ByFolderPathListMock.mockResolvedValue(0);
    getFile115RootCidListByCidListMock.mockResolvedValue([]);
    getFile115RootCidListByFolderPathListMock.mockResolvedValue([]);
    getAllFile115LocalCacheFileNameListMock.mockResolvedValue([]);
    getFile115LocalCacheFileNameListByCidListMock.mockResolvedValue([]);
    getFile115LocalCacheFileNameListByFolderPathListMock.mockResolvedValue([]);
    getFile115CachedParentCidSetByRootCidMock.mockResolvedValue(new Set());
    getFile115RandomByCidListExcludePcMock.mockResolvedValue(undefined);
    getFile115RandomByCidListMock.mockResolvedValue(undefined);
    getUnifiedPicCacheUsageMock.mockResolvedValue({
      rootFileCount: 0,
      rootTotalSizeBytes: 0,
      formattedFileCount: 0,
      formattedTotalSizeBytes: 0,
      totalFileCount: 0,
      totalSizeBytes: 0,
    });
    ensureUnifiedPicCacheWithinLimitMock.mockResolvedValue(undefined);
  });

  test('getRandom115PicMeta returns path and parentPath for the selected image', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_folders: JSON.stringify([{ cid: 'root', status: 'cached' }]),
    });
    getFile115RandomByCidListMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      fullPath: '/Root/Album A/01.jpg',
      isLiked: false,
      localCacheFileName: '',
    });
    get115FileDataMock.mockResolvedValue({
      info: {
        url: { url: 'https://img.example/01.jpg' },
        file_name: '01.jpg',
      },
    });
    get115FileListDataMock.mockResolvedValue({
      path: [{ name: 'Root' }, { name: 'Album A' }],
    });
    generateRandomNumberMock.mockReturnValue(0);

    const { getRandom115PicMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
    const result = await getRandom115PicMeta('test-agent');

    expect(result.path).toBe('/Root/Album A/01.jpg');
    expect(result.parentPath).toBe('/Root/Album A');
  });

  test('getRandom115PicFromParentMeta picks another image in the same parent folder when available', async () => {
    getFile115ByPcMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      fullPath: '/Root/Album A/01.jpg',
      isLiked: false,
      localCacheFileName: '',
    });
    getFile115ByCidAndParentCidMock.mockResolvedValue([
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-1', fullPath: '/Root/Album A/01.jpg' },
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-2', fullPath: '/Root/Album A/02.jpg' },
    ]);
    get115FileDataMock.mockResolvedValue({
      info: {
        url: { url: 'https://img.example/02.jpg' },
        file_name: '02.jpg',
      },
    });
    get115FileListDataMock.mockResolvedValue({
      path: [{ name: 'Root' }, { name: 'Album A' }],
    });
    generateRandomNumberMock.mockReturnValue(0);

    const { getRandom115PicFromParentMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
    const result = await getRandom115PicFromParentMeta({
      pc: 'pc-1',
      userAgent: 'test-agent',
    });

    expect(result.pc).toBe('pc-2');
    expect(result.parentPath).toBe('/Root/Album A');
    expect(result.path).toBe('/Root/Album A/02.jpg');
  });

  test('getRandom115PicFromParentMeta returns the current image when the folder has no sibling image', async () => {
    getFile115ByPcMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      fullPath: '/Root/Album A/01.jpg',
      isLiked: false,
      localCacheFileName: '',
    });
    getFile115ByCidAndParentCidMock.mockResolvedValue([
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-1', fullPath: '/Root/Album A/01.jpg' },
    ]);
    get115FileDataMock.mockResolvedValue({
      info: {
        url: { url: 'https://img.example/01.jpg' },
        file_name: '01.jpg',
      },
    });
    get115FileListDataMock.mockResolvedValue({
      path: [{ name: 'Root' }, { name: 'Album A' }],
    });

    const { getRandom115PicFromParentMeta } = await import('../../apps/api/src/modules/115/service/picture.service');
    const result = await getRandom115PicFromParentMeta({
      pc: 'pc-1',
      userAgent: 'test-agent',
    });

    expect(result.pc).toBe('pc-1');
    expect(result.notice).toBe('当前目录没有其他图片可切换');
  });

  test('clear115PicData supports removing by cid and folder path in one request', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_folders: JSON.stringify([{ cid: 'root-cid', status: 'cached' }]),
    });

    const { clear115PicData } = await import('../../apps/api/src/modules/115/service/picture.service');
    await clear115PicData({
      paths: ['root-cid'],
      folderPaths: ['/Root/Album A'],
    });

    expect(clearFile115ByCidListMock).toHaveBeenCalledWith(['root-cid']);
    expect(clearFile115ByFolderPathListMock).toHaveBeenCalledWith(['/Root/Album A']);
  });

  test('clear115PicData keeps local cached files when removing cache', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_folders: JSON.stringify([{ cid: 'root-cid', status: 'cached' }]),
    });
    getFile115LocalCacheFileNameListByCidListMock.mockResolvedValue(['pc-1.01.jpg']);

    const fsModule = await import('fs');
    const unlinkSpy = vi.spyOn(fsModule.promises, 'unlink').mockImplementation(async () => undefined);

    const { clear115PicData } = await import('../../apps/api/src/modules/115/service/picture.service');
    await clear115PicData({
      paths: ['root-cid'],
    });

    expect(unlinkSpy).not.toHaveBeenCalled();
    unlinkSpy.mockRestore();
  });

  test('clear115PicData marks root folder as partial after removing sub folder cache by folder path', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_folders: JSON.stringify([{ cid: 'root-cid', status: 'cached' }]),
    });
    getFile115RootCidListByFolderPathListMock.mockResolvedValue(['root-cid']);

    const { clear115PicData } = await import('../../apps/api/src/modules/115/service/picture.service');
    await clear115PicData({
      folderPaths: ['/Root/Album A'],
    });

    expect(clearFile115ByFolderPathListMock).toHaveBeenCalledWith(['/Root/Album A']);
    expect(setConfigMock).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('"status":"partial"'));
  });

  test('clear115PicData marks root folder as partial after removing sub folder cache by cid', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_folders: JSON.stringify([{ cid: 'root-cid', status: 'cached' }]),
    });
    getFile115RootCidListByCidListMock.mockResolvedValue(['root-cid']);

    const { clear115PicData } = await import('../../apps/api/src/modules/115/service/picture.service');
    await clear115PicData({
      paths: ['sub-folder-cid'],
    });

    expect(clearFile115ByCidListMock).toHaveBeenCalledWith(['sub-folder-cid']);
    expect(setConfigMock).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('"status":"partial"'));
  });

  test('set115PicInfoData re-queues partial folder to pending', async () => {
    getConfigMock.mockResolvedValue({
      picture_115_folders: JSON.stringify([{ cid: 'root-cid', status: 'partial' }]),
    });

    const { set115PicInfoData } = await import('../../apps/api/src/modules/115/service/picture.service');
    await set115PicInfoData({
      paths: ['root-cid'],
    });

    expect(setConfigMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"cid":"root-cid","status":"pending"')
    );
  });

  test('get115PicInfoData triggers unified cache eviction when local cache is over limit', async () => {
    getConfigMock.mockResolvedValueOnce(null);
    getConfigMock.mockResolvedValueOnce({
      picture_115_random_weights: JSON.stringify({
        localMaxSizeMb: 2048,
      }),
    });
    getUnifiedPicCacheUsageMock.mockResolvedValue({
      rootFileCount: 10,
      rootTotalSizeBytes: 1024,
      formattedFileCount: 5,
      formattedTotalSizeBytes: 512,
      totalFileCount: 15,
      totalSizeBytes: 2300 * 1024 * 1024,
    });

    const { get115PicInfoData } = await import('../../apps/api/src/modules/115/service/picture.service');
    await get115PicInfoData();

    expect(ensureUnifiedPicCacheWithinLimitMock).toHaveBeenCalledWith({
      maxSizeBytes: 2048 * 1024 * 1024,
      wait: true,
    });
  });
});

describe('115 picture controller', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test('getRandom115Pic keeps path fields in json mode', async () => {
    const getRandom115PicMetaMock = vi.fn().mockResolvedValue({
      url: 'https://img.example/01.jpg',
      fileName: '01.jpg',
      cid: 'root',
      pc: 'pc-1',
      path: '/Root/Album A/01.jpg',
      parentPath: '/Root/Album A',
    });

    vi.doMock('../../apps/api/src/modules/115/service/picture.service', async () => ({
      clear115PicData: vi.fn(),
      get115PicInfoData: vi.fn(),
      getRandom115PicMeta: getRandom115PicMetaMock,
      getRandom115PicFromParentMeta: vi.fn(),
      like115PicData: vi.fn(),
      retry115PicData: vi.fn(),
      set115PicInfoData: vi.fn(),
    }));

    const { getRandom115Pic } = await import('../../apps/api/src/modules/115/controller/115.controller');
    const result = await getRandom115Pic({
      query: { mode: 'json' },
      request: { headers: { 'user-agent': 'agent' } },
    } as never);

    expect(result).toMatchObject({
      url: 'https://img.example/01.jpg',
      pc: 'pc-1',
      path: '/Root/Album A/01.jpg',
      parentPath: '/Root/Album A',
    });
  });

  test('getRandom115PicByParent forwards pc and user agent to the parent-folder random service', async () => {
    const getRandom115PicFromParentMetaMock = vi.fn().mockResolvedValue({
      url: 'https://img.example/02.jpg',
      fileName: '02.jpg',
      cid: 'root',
      pc: 'pc-2',
      path: '/Root/Album A/02.jpg',
      parentPath: '/Root/Album A',
    });

    vi.doMock('../../apps/api/src/modules/115/service/picture.service', async () => ({
      clear115PicData: vi.fn(),
      get115PicInfoData: vi.fn(),
      getRandom115PicMeta: vi.fn(),
      getRandom115PicFromParentMeta: getRandom115PicFromParentMetaMock,
      like115PicData: vi.fn(),
      retry115PicData: vi.fn(),
      set115PicInfoData: vi.fn(),
    }));

    const { getRandom115PicByParent } = await import('../../apps/api/src/modules/115/controller/115.controller');
    const result = await getRandom115PicByParent({
      query: { pc: 'pc-1' },
      request: { headers: { 'user-agent': 'agent' } },
    } as never);

    expect(getRandom115PicFromParentMetaMock).toHaveBeenCalledWith({
      pc: 'pc-1',
      userAgent: 'agent',
    });
    expect(result.path).toBe('/Root/Album A/02.jpg');
  });

  test('clear115Pic forwards folderPaths from query to service', async () => {
    const clear115PicDataMock = vi.fn().mockResolvedValue('success');

    vi.doMock('../../apps/api/src/modules/115/service/picture.service', async () => ({
      clear115PicData: clear115PicDataMock,
      get115PicInfoData: vi.fn(),
      getRandom115PicMeta: vi.fn(),
      getRandom115PicFromParentMeta: vi.fn(),
      like115PicData: vi.fn(),
      retry115PicData: vi.fn(),
      set115PicInfoData: vi.fn(),
    }));

    const { clear115Pic } = await import('../../apps/api/src/modules/115/controller/115.controller');
    await clear115Pic({
      query: { folderPaths: '/Root/Album A,/Root/Album B' },
      request: { body: {} },
    } as never);

    expect(clear115PicDataMock).toHaveBeenCalledWith({
      paths: [],
      folderPaths: ['/Root/Album A', '/Root/Album B'],
    });
  });
});
