import { beforeEach, describe, expect, test, vi } from 'vitest';

const findAllMock = vi.fn();

vi.mock('../../apps/api/src/modules/115/model/file115.model', () => ({
  File115Model: {
    findAll: findAllMock,
  },
}));

describe('115 file random query service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test('queries updated_at with an updatedAt alias for cache policy rows', async () => {
    findAllMock.mockResolvedValue([
      {
        pc: 'pc-1',
        isLiked: 1,
        localCacheFileName: 'pc-1.jpg',
        updatedAt: '2026-06-02T01:02:03.000Z',
      },
    ]);

    const { getFile115CachePolicyByPcList } = await import(
      '../../apps/api/src/modules/115/service/file-db.random.query.service'
    );
    const result = await getFile115CachePolicyByPcList(['pc-1']);

    expect(findAllMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: ['pc', 'isLiked', 'localCacheFileName', ['updated_at', 'updatedAt']],
      })
    );
    expect(result).toEqual([
      {
        pc: 'pc-1',
        isLiked: true,
        localCacheFileName: 'pc-1.jpg',
        updatedAtMs: new Date('2026-06-02T01:02:03.000Z').getTime(),
      },
    ]);
  });
});
