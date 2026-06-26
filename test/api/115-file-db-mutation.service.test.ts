import { beforeEach, describe, expect, test, vi } from 'vitest';

const fileFindAllMock = vi.fn();
const fileBulkCreateMock = vi.fn();
const fileDestroyMock = vi.fn();
const segmentDestroyMock = vi.fn();
const segmentBulkCreateMock = vi.fn();

vi.mock('../../apps/api/src/modules/115/model/file115.model', () => ({
  File115Model: {
    findAll: fileFindAllMock,
    bulkCreate: fileBulkCreateMock,
    destroy: fileDestroyMock,
  },
}));

vi.mock('../../apps/api/src/modules/115/model/file115-segment.model', () => ({
  File115PathSegmentModel: {
    destroy: segmentDestroyMock,
    bulkCreate: segmentBulkCreateMock,
  },
}));

describe('115 file db mutation service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    fileFindAllMock.mockResolvedValue([]);
    fileBulkCreateMock.mockResolvedValue([]);
    fileDestroyMock.mockResolvedValue(0);
    segmentDestroyMock.mockResolvedValue(0);
    segmentBulkCreateMock.mockResolvedValue([]);
  });

  test('replaces existing rows that conflict on fullPath and preserves cache policy fields', async () => {
    fileFindAllMock.mockResolvedValue([
      {
        pc: 'old-pc',
        fullPath: '/Root/Album/01.jpg',
        isLiked: true,
        localCacheFileName: 'old-cache.jpg',
      },
    ]);

    const { setFile115List } = await import('../../apps/api/src/modules/115/service/file-db.mutation.service');
    await setFile115List([
      {
        pc: 'new-pc',
        class: 'PIC',
        cid: 'root-cid',
        parentCid: 'folder-cid',
        fullPath: '/Root/Album/01.jpg',
        isLiked: false,
        localCacheFileName: '',
      },
    ]);

    expect(fileDestroyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pc: expect.any(Object),
        }),
      })
    );
    expect(segmentDestroyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pc: expect.any(Object),
        }),
      })
    );
    expect(fileBulkCreateMock).toHaveBeenCalledWith([
      expect.objectContaining({
        pc: 'new-pc',
        fullPath: '/Root/Album/01.jpg',
        isLiked: true,
        localCacheFileName: 'old-cache.jpg',
      }),
    ]);
  });

  test('deduplicates rows that conflict on fullPath within the same batch', async () => {
    const { setFile115List } = await import('../../apps/api/src/modules/115/service/file-db.mutation.service');
    await setFile115List([
      {
        pc: 'pc-1',
        class: 'PIC',
        cid: 'root-cid',
        parentCid: 'folder-cid',
        fullPath: '/Root/Album/01.jpg',
        isLiked: false,
        localCacheFileName: '',
      },
      {
        pc: 'pc-2',
        class: 'PIC',
        cid: 'root-cid',
        parentCid: 'folder-cid',
        fullPath: '/Root/Album/01.jpg',
        isLiked: true,
        localCacheFileName: 'cache-2.jpg',
      },
    ]);

    expect(fileBulkCreateMock).toHaveBeenCalledWith([
      expect.objectContaining({
        pc: 'pc-1',
        fullPath: '/Root/Album/01.jpg',
        isLiked: true,
        localCacheFileName: 'cache-2.jpg',
      }),
    ]);
  });
});
