import { beforeEach, describe, expect, test, vi } from 'vitest';

const getConfigMock = vi.fn();
const clearConfigMock = vi.fn();
const setConfigMock = vi.fn();
const getFile115ParentGroupByCidListMock = vi.fn();
const getFile115ByCidParentCidIndexMock = vi.fn();
const getFile115ByCidIndexMock = vi.fn();
const getFile115ByPcMock = vi.fn();
const getFile115ByCidAndParentCidMock = vi.fn();
const get115FileDataMock = vi.fn();
const get115FileListDataMock = vi.fn();
const generateRandomNumberMock = vi.fn();

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: getConfigMock,
  clearConfig: clearConfigMock,
  setConfig: setConfigMock,
}));

vi.mock('../../apps/api/src/modules/115/service/file-db.service', () => ({
  getFile115Len: vi.fn(),
  getFile115CountByCid: vi.fn(),
  clearAllFile115: vi.fn(),
  clearFile115ByCidList: vi.fn(),
  setFile115List: vi.fn(),
  getFile115ParentGroupByCidList: getFile115ParentGroupByCidListMock,
  getFile115ByCidParentCidIndex: getFile115ByCidParentCidIndexMock,
  getFile115ByCidIndex: getFile115ByCidIndexMock,
  getFile115ByPc: getFile115ByPcMock,
  getFile115ByCidAndParentCid: getFile115ByCidAndParentCidMock,
}));

vi.mock('../../apps/api/src/modules/115/service/file.service', () => ({
  get115FileData: get115FileDataMock,
  get115FileListData: get115FileListDataMock,
}));

vi.mock('../../apps/api/src/utils/number', () => ({
  generateRandomNumber: generateRandomNumberMock,
}));

describe('115 picture service random meta', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getConfigMock.mockResolvedValue(null);
    clearConfigMock.mockResolvedValue(undefined);
    setConfigMock.mockResolvedValue(undefined);
  });

  test('getRandom115PicMeta returns path and parentPath for the selected image', async () => {
    getConfigMock
      .mockResolvedValueOnce({
        picture_115_folders: JSON.stringify([{ cid: 'root', status: 'cached' }]),
      })
      .mockResolvedValueOnce(null);
    getFile115ParentGroupByCidListMock.mockResolvedValue([{ cid: 'root', parentCid: 'folder-a', count: 2 }]);
    getFile115ByCidParentCidIndexMock.mockResolvedValue({
      cid: 'root',
      parentCid: 'folder-a',
      pc: 'pc-1',
      name: '01.jpg',
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
      name: '01.jpg',
    });
    getFile115ByCidAndParentCidMock.mockResolvedValue([
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-1', name: '01.jpg' },
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-2', name: '02.jpg' },
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
      name: '01.jpg',
    });
    getFile115ByCidAndParentCidMock.mockResolvedValue([
      { cid: 'root', parentCid: 'folder-a', pc: 'pc-1', name: '01.jpg' },
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
});
