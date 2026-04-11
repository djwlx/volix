import { Tag } from '@douyinfe/semi-ui';
import type { PicCacheFolderItem, PicCacheFolderStatus } from '@volix/types';

export const picCacheStatusOrder: Record<PicCacheFolderStatus, number> = {
  caching: 0,
  pending: 1,
  failed: 2,
  cached: 3,
};

const statusMetaMap: Record<PicCacheFolderStatus, { text: string; color: 'amber' | 'blue' | 'green' | 'red' }> = {
  pending: { text: '等待中', color: 'blue' },
  caching: { text: '缓存中', color: 'amber' },
  cached: { text: '已缓存', color: 'green' },
  failed: { text: '缓存失败', color: 'red' },
};

export function getPicCacheStatusMeta(status: PicCacheFolderStatus) {
  return statusMetaMap[status];
}

export function renderPicCacheStatusTag(folder: Pick<PicCacheFolderItem, 'status'>) {
  const meta = statusMetaMap[folder.status];
  return (
    <Tag size="small" shape="circle" color={meta.color}>
      {meta.text}
    </Tag>
  );
}
