import { Tag } from '@douyinfe/semi-ui';
import type { PicCacheFolderItem, PicCacheFolderStatus } from '@volix/types';
import { translateClient } from '@/i18n';

export const picCacheStatusOrder: Record<PicCacheFolderStatus, number> = {
  caching: 0,
  pending: 1,
  failed: 2,
  partial: 3,
  cached: 4,
};

const statusMetaMap: Record<PicCacheFolderStatus, { text: string; color: 'amber' | 'blue' | 'green' | 'red' }> = {
  pending: { text: 'pic115.status.pending', color: 'blue' },
  caching: { text: 'pic115.status.caching', color: 'amber' },
  partial: { text: 'pic115.status.partial', color: 'amber' },
  cached: { text: 'pic115.status.cached', color: 'green' },
  failed: { text: 'pic115.status.failed', color: 'red' },
};

export function getPicCacheStatusMeta(status: PicCacheFolderStatus) {
  const meta = statusMetaMap[status];
  return {
    ...meta,
    text: translateClient(meta.text),
  };
}

export function renderPicCacheStatusTag(folder: Pick<PicCacheFolderItem, 'status'>) {
  const meta = getPicCacheStatusMeta(folder.status);
  return (
    <Tag size="small" shape="circle" color={meta.color}>
      {meta.text}
    </Tag>
  );
}
