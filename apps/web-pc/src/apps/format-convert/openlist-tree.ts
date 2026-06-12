import type { ReactNode } from 'react';
import type { FormatConvertOpenlistBrowserItem } from '@volix/types';

export interface OpenlistTreeNode {
  key: string;
  value: string;
  label: string;
  path: string;
  name: string;
  icon?: ReactNode;
  isLeaf?: boolean;
  loaded?: boolean;
  children?: OpenlistTreeNode[];
}

export const toOpenlistTreeNodes = (
  items: FormatConvertOpenlistBrowserItem[],
  mode: 'file' | 'dir'
): OpenlistTreeNode[] => {
  const sourceItems = mode === 'dir' ? items.filter(item => item.isDir) : items;

  return sourceItems.map(item => ({
    key: item.path,
    value: item.path,
    label: item.name,
    name: item.name,
    path: item.path,
    ...(!item.isDir && mode === 'file' ? { icon: [] } : {}),
    isLeaf: !item.isDir,
    children: item.isDir ? undefined : [],
  }));
};

export const updateOpenlistTreeChildren = (
  nodes: OpenlistTreeNode[],
  targetPath: string,
  children: OpenlistTreeNode[]
): OpenlistTreeNode[] => {
  return nodes.map(node => {
    if (node.path === targetPath) {
      return {
        ...node,
        children,
        loaded: true,
      };
    }
    if (!node.children?.length) {
      return node;
    }
    return {
      ...node,
      children: updateOpenlistTreeChildren(node.children, targetPath, children),
    };
  });
};
