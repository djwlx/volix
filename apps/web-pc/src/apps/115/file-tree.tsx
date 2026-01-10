import { Card, Tree, Typography } from '@douyinfe/semi-ui';
import { useFileList, type FileItem } from './hooks/useFileList';
import { useEffect, useState } from 'react';
import type { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { IconMore } from '@douyinfe/semi-icons';
const { Paragraph } = Typography;

export function FileTree() {
  const [fileTree, setFileTree] = useState<TreeNodeData[]>([]);
  const { getListInfo } = useFileList();

  const formatTreeData = (data: FileItem[]): TreeNodeData[] => {
    const treeData = data.map(item => {
      const isDir = !item.fid;

      const fileItem: TreeNodeData = {
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {item.name}
            {isDir && <Paragraph copyable>{item.dir}</Paragraph>}
          </div>
        ),
        value: item.id,
        key: item.id,
        isLeaf: !isDir,
        dir: item.dir,
      };
      return fileItem;
    });
    treeData.push({
      label: <div style={{ fontStyle: 'italic' }}>加载更多</div>,
      key: `${treeData[treeData.length - 1].key}-load_more`,
      isLeaf: true,
      value: `${treeData[treeData.length - 1].key}-load_more`,
      icon: <IconMore />,
    });

    return treeData;
  };

  const updateTreeData = (list: TreeNodeData[], key: string, children: TreeNodeData[]): TreeNodeData[] => {
    return list.map(node => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateTreeData(node.children, key, children) };
      }
      return node;
    });
  };

  const loadData = async (node?: TreeNodeData): Promise<void> => {
    const { key, dir, children } = node || {};
    return new Promise(resolve => {
      if (children) {
        resolve();
        return;
      }
      getListInfo(dir).then(res => {
        setFileTree(prevTree => {
          const newChildren = formatTreeData(res);
          const newTree = updateTreeData(prevTree, key as string, newChildren);
          return newTree;
        });
        resolve();
      });
    });
  };

  useEffect(() => {
    getListInfo().then(res => {
      setFileTree(formatTreeData(res));
    });
  }, []);

  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <Tree directory treeData={fileTree} loadData={loadData} />
    </Card>
  );
}
