import { useEffect, useRef, useState } from 'react';
import { get115FileList } from '@/services/115';

const FOLDER_PAGE_SIZE = 100;

export interface FolderEntry {
  cid: string;
  name: string;
}

export interface Folder115Row {
  key: string;
  name: string;
  pc: string;
  cid: string;
  isDir: boolean;
}

export function useFolderBrowser(rootName: string) {
  const rootEntry: FolderEntry = { cid: '0', name: rootName };
  const [stack, setStack] = useState<FolderEntry[]>([rootEntry]);
  const [rows, setRows] = useState<Folder115Row[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const load = async (nextStack: FolderEntry[], nextPage: number) => {
    const target = nextStack[nextStack.length - 1];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      const offset = (nextPage - 1) * FOLDER_PAGE_SIZE;
      const res = await get115FileList({ cid: target.cid, offset, pageSize: FOLDER_PAGE_SIZE });
      if (requestId !== requestIdRef.current) {
        return;
      }

      const list: Folder115Row[] = (res.data.data || []).map(item => ({
        key: item.pc,
        name: item.n,
        pc: item.pc,
        cid: item.cid,
        isDir: !item.fid,
      }));

      setStack(nextStack);
      setRows(list);
      setTotal(res.data.count);
      setPage(nextPage);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const enter = (entry: FolderEntry) => {
    void load([...stack, entry], 1);
  };

  const navigateTo = (index: number) => {
    if (index < 0 || index >= stack.length) {
      return;
    }
    void load(stack.slice(0, index + 1), 1);
  };

  const goToPage = (nextPage: number) => {
    void load(stack, nextPage);
  };

  const refresh = () => {
    void load(stack, page);
  };

  useEffect(() => {
    void load([rootEntry], 1);
  }, []);

  return {
    stack,
    rows,
    page,
    total,
    pageSize: FOLDER_PAGE_SIZE,
    loading,
    enter,
    navigateTo,
    goToPage,
    refresh,
  };
}
