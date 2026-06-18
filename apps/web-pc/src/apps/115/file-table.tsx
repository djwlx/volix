import { useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { PicCacheFolderItem, PicCacheFolderStatus } from '@volix/types';
import { FileTableBrowser, type FileTableAction, type FileTableColumn } from '@/components/file-table-browser';
import { clear115Pic, get115PicInfo, set115PicInfo } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { useI18n } from '@/i18n';
import { renderPicCacheStatusTag } from './pic-cache-status';
import { useFolderBrowser, type Folder115Row } from './hooks/useFolderBrowser';
import { subscribeToPic115InfoEvents } from './pic-realtime';
import { websocketEventBus } from '@/services/websocket-event-bus';

const normalizeFolderPath = (folderPath: string) => {
  const normalized = `/${String(folderPath || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')}`;
  if (normalized === '/' || normalized === '/.') {
    return '/';
  }
  return normalized.replace(/\/+$/, '');
};

export function FileTable() {
  const { t } = useI18n();
  const { stack, rows, page, total, pageSize, loading, enter, navigateTo, goToPage, refresh } = useFolderBrowser(
    t('pic115.fileTable.root')
  );
  const [folderStatusMap, setFolderStatusMap] = useState<Record<string, PicCacheFolderItem>>({});
  const [cachedCidMap, setCachedCidMap] = useState<Record<string, true>>({});
  const [cachedFolderPathList, setCachedFolderPathList] = useState<string[]>([]);

  const applyPicInfoState = (data: {
    folders?: PicCacheFolderItem[];
    cachedCids?: string[];
    cachedFolderPaths?: string[];
  }) => {
    setFolderStatusMap(
      (data.folders || []).reduce((acc, item) => {
        acc[item.cid] = item;
        return acc;
      }, {} as Record<string, PicCacheFolderItem>)
    );
    setCachedCidMap(
      (data.cachedCids || []).reduce((acc, cid) => {
        if (cid) {
          acc[cid] = true;
        }
        return acc;
      }, {} as Record<string, true>)
    );
    setCachedFolderPathList((data.cachedFolderPaths || []).map(item => normalizeFolderPath(item)));
  };

  const fetchPicInfo = async () => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      applyPicInfoState(result.data);
    }
  };

  const onCopyCid = async (cid: string) => {
    try {
      await navigator.clipboard.writeText(cid);
      Toast.success(t('pic115.fileTree.copyCidSuccess'));
    } catch {
      Toast.error(t('common.action.copyFailed'));
    }
  };

  const onAddCache = async (cid: string) => {
    try {
      const response = await set115PicInfo({ paths: [cid] });
      if (response.code === 0) {
        applyPicInfoState(response.data);
      }
      Toast.success(t('pic115.fileTree.addCacheSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.fileTree.addCacheFailed')));
    }
  };

  const onRemoveCache = async (cid: string, folderPath: string) => {
    const confirmed = window.confirm(t('pic115.fileTree.removeConfirm'));
    if (!confirmed) {
      return;
    }

    try {
      const response = await clear115Pic({
        paths: cid ? [cid] : [],
        folderPaths: folderPath ? [folderPath] : [],
      });
      if (response.code === 0 && response.data && typeof response.data === 'object') {
        applyPicInfoState(
          response.data as { folders?: PicCacheFolderItem[]; cachedCids?: string[]; cachedFolderPaths?: string[] }
        );
      }
      Toast.success(t('pic115.fileTree.removeSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.fileTree.removeFailed')));
    }
  };

  const getFolderCacheMatch = (folderPath: string) => {
    const normalizedPath = normalizeFolderPath(folderPath);
    const prefix = `${normalizedPath}/`;
    const hasExact = cachedFolderPathList.some(item => item === normalizedPath);
    const hasDescendant = cachedFolderPathList.some(item => item.startsWith(prefix));
    return { hasExact, hasDescendant, hasAny: hasExact || hasDescendant };
  };

  const getRowFullPath = (row: Folder115Row) => {
    const prefix = stack.slice(1).map(entry => entry.name);
    return normalizeFolderPath([...prefix, row.name].join('/'));
  };

  const getRowCacheState = (row: Folder115Row) => {
    const folderInfo = folderStatusMap[row.cid];
    const hasDirectCache = Boolean(folderInfo) || Boolean(cachedCidMap[row.cid]);
    const folderCacheMatch = row.isDir
      ? getFolderCacheMatch(getRowFullPath(row))
      : { hasExact: false, hasDescendant: false, hasAny: false };
    let displayStatus: PicCacheFolderStatus | '' = '';

    if (folderInfo?.status) {
      displayStatus = folderInfo.status;
    } else if (hasDirectCache || folderCacheMatch.hasExact) {
      displayStatus = 'cached';
    } else if (folderCacheMatch.hasDescendant) {
      displayStatus = 'partial';
    }

    return {
      displayStatus,
      canRemoveCache: hasDirectCache || folderCacheMatch.hasAny,
      canAddCache: displayStatus === '' || displayStatus === 'partial' || displayStatus === 'failed',
    };
  };

  useEffect(() => {
    fetchPicInfo().catch(() => undefined);
    const unsubscribe = subscribeToPic115InfoEvents({
      onChanged: () => {
        fetchPicInfo().catch(() => undefined);
      },
      onReconnect: () => {
        fetchPicInfo().catch(() => undefined);
      },
    });
    void websocketEventBus.connect();

    return () => {
      unsubscribe();
    };
  }, []);

  const columns: FileTableColumn<Folder115Row>[] = [
    {
      key: 'status',
      title: t('pic115.fileTable.colStatus'),
      width: 96,
      render: row => {
        if (!row.isDir) {
          return null;
        }
        const { displayStatus } = getRowCacheState(row);
        return displayStatus ? renderPicCacheStatusTag({ status: displayStatus }) : null;
      },
    },
  ];

  const actions: FileTableAction<Folder115Row>[] = [
    {
      key: 'copyCid',
      visible: row => row.isDir,
      label: () => t('pic115.fileTree.action.copyCid'),
      onClick: row => void onCopyCid(row.cid),
    },
    {
      key: 'addCache',
      visible: row => row.isDir,
      disabled: row => !getRowCacheState(row).canAddCache,
      label: row => {
        const { displayStatus, canAddCache } = getRowCacheState(row);
        return t(
          displayStatus === 'partial'
            ? 'pic115.fileTree.action.completeCache'
            : canAddCache
            ? 'pic115.fileTree.action.addCache'
            : 'pic115.fileTree.action.cached'
        );
      },
      onClick: row => void onAddCache(row.cid),
    },
    {
      key: 'removeCache',
      visible: row => row.isDir,
      disabled: row => !getRowCacheState(row).canRemoveCache,
      label: () => t('pic115.fileTree.action.removeCache'),
      onClick: row => void onRemoveCache(row.cid, getRowFullPath(row)),
    },
  ];

  return (
    <FileTableBrowser<Folder115Row>
      rows={rows}
      loading={loading}
      rowKey={row => row.key}
      isDir={row => row.isDir}
      getName={row => row.name}
      columns={columns}
      actions={actions}
      actionTitle={t('pic115.fileTable.actionTitle')}
      breadcrumb={stack.map((entry, index) => ({ label: entry.name, value: String(index) }))}
      onNavigate={value => navigateTo(Number(value))}
      onEnterDir={row => enter({ cid: row.cid, name: row.name })}
      onRefresh={refresh}
      pagination={{
        currentPage: page,
        pageSize,
        total,
        onPageChange: goToPage,
        formatPageText: pageInfo =>
          t('common.fileTable.paginationSummary', {
            start: pageInfo?.currentStart ?? 0,
            end: pageInfo?.currentEnd ?? 0,
            total: pageInfo?.total ?? 0,
          }),
      }}
    />
  );
}
