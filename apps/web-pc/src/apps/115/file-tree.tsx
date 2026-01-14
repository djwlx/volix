import { Card, Tree, Typography } from '@douyinfe/semi-ui';
import { useFileList, type FileItem, type UndoneMapItem } from './hooks/useFileList';
import { useEffect, useState } from 'react';
import type { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { IconMore } from '@douyinfe/semi-icons';
const { Paragraph } = Typography;

export function FileTree() {
  const [fileTree, setFileTree] = useState<TreeNodeData[]>([]);
  const { fileTree: treeData, loadMore, unDoneMap } = useFileList();

  const formatTreeData = (data: FileItem[], unComplete: Record<string, UndoneMapItem>, dir: string): TreeNodeData[] => {
    const treeData = data.map(item => {
      const isDir = !item.fid;
      const fileItem: TreeNodeData = {
        ...item,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span> {item.name}</span>
            {isDir && <span>{item.children?.length}</span>}
            {isDir && <Paragraph copyable>{item.dir}</Paragraph>}
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
        label: <div onClick={() => loadMore(dir)}>加载更多</div>,
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
  }, [treeData, unDoneMap]);

  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <Tree directory treeData={fileTree} loadData={loadData} />
    </Card>
  );
}
