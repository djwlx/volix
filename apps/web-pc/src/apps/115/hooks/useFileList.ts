import { get115FileList } from '@/services/115';
import type { FileListDataItem } from '@volix/types';

export interface FileItem {
  name: FileListDataItem['n'];
  id: FileListDataItem['pc'];
  dir: FileListDataItem['cid'];
  fid?: FileListDataItem['fid'];
  isLast?: boolean;
}

export function useFileList() {
  const getListInfo = async (cid?: string) => {
    const res = await get115FileList({ cid: cid ?? '0' });

    const count = res.data.count;

    return res.data.data?.map(item => {
      const file: FileItem = {
        name: item.n,
        id: item.pc,
        dir: item.cid,
        fid: item.fid,
      };
      return file;
    });
  };

  return {
    getListInfo,
  };
}
