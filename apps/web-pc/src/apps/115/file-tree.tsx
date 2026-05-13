import { Card, Dropdown, Toast, Tree } from '@douyinfe/semi-ui';
import { IconMore } from '@douyinfe/semi-icons';
import { useFileList, type FileItem, type UndoneMapItem } from './hooks/useFileList';
import { useEffect, useState } from 'react';
import type { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import type { PicCacheFolderItem, PicCacheFolderStatus } from '@volix/types';
import { clear115Pic, get115PicInfo, set115PicInfo } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { renderPicCacheStatusTag } from './pic-cache-status';

type PicTreeNodeData = TreeNodeData & {
  dir?: string;
  fullPath?: string;
};

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

export function FileTree() {
  const [fileTree, setFileTree] = useState<PicTreeNodeData[]>([]);
  const { fileTree: treeData, loadMore, moreLoading, unDoneMap } = useFileList();
  const [loadingMoreDir, setLoadingMoreDir] = useState('');
  const [folderStatusMap, setFolderStatusMap] = useState<Record<string, PicCacheFolderItem>>({});
  const [cachedCidMap, setCachedCidMap] = useState<Record<string, true>>({});
  const [cachedFolderPathList, setCachedFolderPathList] = useState<string[]>([]);

  const fetchPicInfo = async () => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      setFolderStatusMap(
        result.data.folders.reduce((acc, item) => {
          acc[item.cid] = item;
          return acc;
        }, {} as Record<string, PicCacheFolderItem>)
      );
      setCachedCidMap(
        (result.data.cachedCids || []).reduce((acc, cid) => {
          if (cid) {
            acc[cid] = true;
          }
          return acc;
        }, {} as Record<string, true>)
      );
      setCachedFolderPathList((result.data.cachedFolderPaths || []).map(item => normalizeFolderPath(item)));
    }
  };

  const onCopyCid = async (cid: string) => {
    try {
      await navigator.clipboard.writeText(cid);
      Toast.success('CID 已复制');
    } catch {
      Toast.error('复制失败');
    }
  };

  const onAddCache = async (cid: string) => {
    try {
      await set115PicInfo({ paths: [cid] });
      await fetchPicInfo();
      Toast.success('已加入缓存队列');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '加入缓存失败'));
    }
  };

  const onRemoveCache = async (cid: string, folderPath?: string) => {
    const confirmed = window.confirm('确定删除该目录缓存？此修改将不可逆');
    if (!confirmed) {
      return;
    }

    try {
      const payload = {
        paths: cid ? [cid] : [],
        folderPaths: folderPath ? [folderPath] : [],
      };
      await clear115Pic(payload);
      await fetchPicInfo();
      Toast.success('已删除该目录缓存');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '删除缓存失败'));
    }
  };

  const getFolderCacheMatch = (folderPath: string) => {
    const normalizedPath = normalizeFolderPath(folderPath);
    const prefix = `${normalizedPath}/`;
    const hasExact = cachedFolderPathList.some(item => item === normalizedPath);
    const hasDescendant = cachedFolderPathList.some(item => item.startsWith(prefix));
    return {
      hasExact,
      hasDescendant,
      hasAny: hasExact || hasDescendant,
    };
  };

  const formatTreeData = (
    data: FileItem[],
    unComplete: Record<string, UndoneMapItem>,
    dir: string,
    parentPath = ''
  ): PicTreeNodeData[] => {
    const treeData = data.map(item => {
      const isDir = !item.fid;
      const fullPath = normalizeFolderPath(parentPath ? `${parentPath}/${item.name}` : `/${item.name}`);
      const folderInfo = folderStatusMap[item.dir];
      const hasDirectCache = Boolean(folderInfo) || Boolean(cachedCidMap[item.dir]);
      const folderCacheMatch = isDir
        ? getFolderCacheMatch(fullPath)
        : { hasExact: false, hasDescendant: false, hasAny: false };
      let displayStatus: PicCacheFolderStatus | '' = '';

      if (folderInfo?.status) {
        displayStatus = folderInfo.status;
      } else if (hasDirectCache) {
        displayStatus = 'cached';
      } else if (folderCacheMatch.hasExact) {
        displayStatus = 'cached';
      } else if (folderCacheMatch.hasDescendant) {
        displayStatus = 'partial';
      }

      const canRemoveCache = hasDirectCache || folderCacheMatch.hasAny;
      const canAddCache = displayStatus === '' || displayStatus === 'partial' || displayStatus === 'failed';
      const fileItem: PicTreeNodeData = {
        ...item,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0 }}>{item.name}</span>
            {isDir && displayStatus
              ? renderPicCacheStatusTag({
                  status: displayStatus,
                })
              : null}
            {isDir ? (
              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={event => {
                        event.stopPropagation();
                        void onCopyCid(item.dir);
                      }}
                    >
                      复制 CID
                    </Dropdown.Item>
                    <Dropdown.Item
                      disabled={!canAddCache}
                      onClick={event => {
                        event.stopPropagation();
                        void onAddCache(item.dir);
                      }}
                    >
                      {displayStatus === 'partial' ? '补全缓存' : canAddCache ? '加入缓存' : '已加入缓存'}
                    </Dropdown.Item>
                    <Dropdown.Item
                      disabled={!canRemoveCache}
                      onClick={event => {
                        event.stopPropagation();
                        void onRemoveCache(item.dir, fullPath);
                      }}
                    >
                      去掉缓存
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              >
                <span
                  onClick={event => event.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: '#666' }}
                >
                  <IconMore />
                </span>
              </Dropdown>
            ) : null}
          </div>
        ),
        value: item.id,
        key: item.id,
        isLeaf: !isDir,
        dir: item.dir,
        fullPath,
        children: item.children ? formatTreeData(item.children, unComplete, item.dir, fullPath) : undefined,
      };
      return fileItem;
    });

    if (dir in unComplete) {
      const useId = `${dir}-load-more`;
      treeData.push({
        label:
          loadingMoreDir === dir ? (
            <div>加载中</div>
          ) : (
            <div
              onClick={() => {
                setLoadingMoreDir(dir);
                loadMore(dir);
              }}
            >
              加载更多
            </div>
          ),
        icon: <IconMore />,
        value: useId,
        key: useId,
        isLeaf: true,
      } as PicTreeNodeData);
    }

    return treeData;
  };

  const loadData = async (node?: TreeNodeData): Promise<void> => {
    const { dir } = node || {};
    return new Promise(resolve => {
      loadMore(dir).then(() => {
        resolve();
      });
    });
  };

  useEffect(() => {
    const data = formatTreeData(treeData, unDoneMap, '0');
    setFileTree(data);
  }, [treeData, unDoneMap, loadingMoreDir, folderStatusMap, cachedCidMap, cachedFolderPathList]);

  useEffect(() => {
    if (!moreLoading) {
      setLoadingMoreDir('');
    }
  }, [moreLoading]);

  useEffect(() => {
    fetchPicInfo().catch(() => undefined);
    const timer = window.setInterval(() => {
      fetchPicInfo().catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <Tree directory treeData={fileTree} loadData={loadData} />
    </Card>
  );
}
