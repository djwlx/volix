import { getCloud115Sdk } from './sdk.service';

export async function get115FileListData(offset: number, pageSize: number, cid: string) {
  const sdk = await getCloud115Sdk();
  return sdk.getFileList(offset, pageSize, cid);
}

export async function get115FileData(pc: string, userAgent: string) {
  const sdk = await getCloud115Sdk();
  return sdk.getFile(pc, userAgent);
}
