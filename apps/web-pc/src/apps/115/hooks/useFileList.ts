import { get115FileList } from '@/services/115';
import type { FileListData, FileListDataItem } from '@volix/types';
import { useEffect, useState } from 'react';

export interface FileItem {
  name: FileListDataItem['n'];
  id: FileListDataItem['pc'];
  dir: FileListDataItem['cid'];
  fid?: FileListDataItem['fid'];
  isLast?: boolean;
  children?: FileItem[];
}

export interface UndoneMapItem {
  total: number;
  now: number;
}

export function useFileList(dir?: string) {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [unDoneMap, setUndoneMap] = useState<Record<string, UndoneMapItem>>({});
  const [rootPath, setRootPath] = useState<FileListData['path']>([]);
  const [loading, setLoading] = useState(false);

  const getListInfo = async (dir: string, offset?: number, pageSize?: number) => {
    try {
      setLoading(true);
      const res = await get115FileList({ cid: dir, offset, pageSize });

      const count = res.data.count;

      const path = res.data.path;

      const list = res.data.data?.map(item => {
        const file: FileItem = {
          name: item.n,
          id: item.pc,
          dir: item.cid,
          fid: item.fid,
        };
        return file;
      });

      const len = list.length;

      if (dir in unDoneMap) {
        const total = count;
        const now = unDoneMap[dir].now + len;
        if (now < total) {
          setUndoneMap(pre => {
            return {
              ...pre,
              [dir]: {
                now,
                total: count,
              },
            };
          });
        } else {
          setUndoneMap(pre => {
            const temp = { ...pre };
            delete temp[dir];
            return temp;
          });
        }
      } else {
        if (list.length < count) {
          setUndoneMap(pre => {
            return {
              ...pre,
              [dir]: {
                now: len,
                total: count,
              },
            };
          });
        }
      }

      return { list, count, path };
    } finally {
      setLoading(false);
    }
  };

  const findNode = (list: FileItem[], dir: string): FileItem | undefined => {
    if (!list) return undefined;
    if (!dir) return undefined;
    for (const node of list) {
      if (node.dir === dir) return node;
      if (node.children) {
        const found = findNode(node.children, dir);
        if (found) return found;
      }
    }
    return undefined;
  };

  const setNode = (list: FileItem[], dir: string, children: FileItem[]): FileItem[] => {
    return list.map(node => {
      if (node.dir === dir) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: setNode(node.children, dir, children) };
      }
      return node;
    });
  };

  const loadRoot = async (dir?: string) => {
    const res = await getListInfo(dir ?? '0');
    setFileTree(res.list);
    setRootPath(res.path);
  };

  const loadMore = async (dir?: string) => {
    const dirTemp = dir ?? '0';
    const find = findNode(fileTree, dirTemp);
    const before = find?.children || [];
    const offset = before.length;
    const res = await getListInfo(dirTemp, offset);
    const newTree = setNode(fileTree, dirTemp, before.concat(res.list));
    setFileTree(newTree);
  };

  useEffect(() => {
    loadRoot(dir);
  }, [dir]);

  return {
    fileTree,
    unDoneMap,
    loadMore,
    getListInfo,
    rootPath,
    loading,
  };
}
