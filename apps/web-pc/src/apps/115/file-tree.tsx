import { Card, Dropdown, Toast, Tree } from '@douyinfe/semi-ui';
import { IconMore } from '@douyinfe/semi-icons';
import { useFileList, type FileItem, type UndoneMapItem } from './hooks/useFileList';
import { useEffect, useState } from 'react';
import type { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import type { PicCacheFolderItem } from '@volix/types';
import { get115PicInfo, set115PicInfo } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { renderPicCacheStatusTag } from './pic-cache-status';

export function FileTree() {
  const [fileTree, setFileTree] = useState<TreeNodeData[]>([]);
  const { fileTree: treeData, loadMore, moreLoading, unDoneMap } = useFileList();
  const [loadingMoreDir, setLoadingMoreDir] = useState('');
  const [folderStatusMap, setFolderStatusMap] = useState<Record<string, PicCacheFolderItem>>({});

  const fetchPicInfo = async () => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      setFolderStatusMap(
        result.data.folders.reduce((acc, item) => {
          acc[item.cid] = item;
          return acc;
        }, {} as Record<string, PicCacheFolderItem>)
      );
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

  const formatTreeData = (data: FileItem[], unComplete: Record<string, UndoneMapItem>, dir: string): TreeNodeData[] => {
    const treeData = data.map(item => {
      const isDir = !item.fid;
      const folderInfo = folderStatusMap[item.dir];
      const fileItem: TreeNodeData = {
        ...item,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0 }}>{item.name}</span>
            {isDir && folderInfo ? renderPicCacheStatusTag(folderInfo) : null}
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
                      disabled={Boolean(folderInfo)}
                      onClick={event => {
                        event.stopPropagation();
                        void onAddCache(item.dir);
                      }}
                    >
                      {folderInfo ? '已加入缓存' : '加入缓存'}
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
        children: item.children ? formatTreeData(item.children, unComplete, item.dir) : undefined,
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
      });
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
  }, [treeData, unDoneMap, loadingMoreDir, folderStatusMap]);

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
