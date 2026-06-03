import { describe, expect, it } from 'vitest';
import { buildPicSettingStatsData } from './pic-setting-stats';

describe('buildPicSettingStatsData', () => {
  it('rebuilds translated labels for the active locale', () => {
    const zhData = buildPicSettingStatsData({
      count: 12,
      folderCount: 3,
      localCacheFileCount: 8,
      localCacheTotalSizeMb: 256,
      labels: {
        cacheCount: 'zh:pic115.stats.cacheCount',
        cacheFolderCount: 'zh:pic115.stats.cacheFolderCount',
        localFileCount: 'zh:pic115.stats.localFileCount',
        localUsage: 'zh:pic115.stats.localUsage',
        status: 'zh:pic115.stats.status',
        localCapacity: 'zh:pic115.stats.localCapacity',
      },
      statusTag: 'zh:status',
      localCapacityTag: 'zh:capacity',
    });
    const enData = buildPicSettingStatsData({
      count: 12,
      folderCount: 3,
      localCacheFileCount: 8,
      localCacheTotalSizeMb: 256,
      labels: {
        cacheCount: 'en:pic115.stats.cacheCount',
        cacheFolderCount: 'en:pic115.stats.cacheFolderCount',
        localFileCount: 'en:pic115.stats.localFileCount',
        localUsage: 'en:pic115.stats.localUsage',
        status: 'en:pic115.stats.status',
        localCapacity: 'en:pic115.stats.localCapacity',
      },
      statusTag: 'en:status',
      localCapacityTag: 'en:capacity',
    });

    expect(zhData[0]?.key).toBe('zh:pic115.stats.cacheCount');
    expect(enData[0]?.key).toBe('en:pic115.stats.cacheCount');
    expect(zhData[4]?.value).not.toBe(enData[4]?.value);
  });
});
