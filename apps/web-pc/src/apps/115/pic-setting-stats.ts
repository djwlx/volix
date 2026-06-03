import type { ReactNode } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';

interface BuildPicSettingStatsDataParams {
  count: number;
  folderCount: number;
  localCacheFileCount: number;
  localCacheTotalSizeMb: number;
  labels: {
    cacheCount: string;
    cacheFolderCount: string;
    localFileCount: string;
    localUsage: string;
    status: string;
    localCapacity: string;
  };
  statusTag: ReactNode;
  localCapacityTag: ReactNode;
}

export const buildPicSettingStatsData = ({
  count,
  folderCount,
  localCacheFileCount,
  localCacheTotalSizeMb,
  labels,
  statusTag,
  localCapacityTag,
}: BuildPicSettingStatsDataParams): Data[] => {
  return [
    { key: labels.cacheCount, value: count },
    { key: labels.cacheFolderCount, value: folderCount },
    { key: labels.localFileCount, value: localCacheFileCount },
    { key: labels.localUsage, value: `${localCacheTotalSizeMb} MB` },
    { key: labels.status, value: statusTag },
    { key: labels.localCapacity, value: localCapacityTag },
  ];
};
