import type { FileListDataItem, PicInfoParams } from '@volix/types';
import { AppConfigEnum } from '../../config/model/config.model';
import { clearConfig, getConfig, setConfig } from '../../config/service/config.service';
import { badRequest } from '../../shared/http-handler';
import { calculateTimeDifference, waitTime } from '../../../utils/date';
import { log } from '../../../utils/logger';
import { generateRandomNumber } from '../../../utils/number';
import { Cloud115DbFileItem, RandomPicMeta } from '../types/115.types';
import { get115FileData } from './file.service';
import { clearAllFile115, getFile115ByIndex, getFile115Len, setFile115List } from './file-db.service';
import { getCloud115Sdk } from './sdk.service';

type Cloud115FileListItem = FileListDataItem & {
  class?: string;
};

const saveFile115List = async (dataList: Cloud115FileListItem[]) => {
  const list: Cloud115DbFileItem[] = dataList.map(item => ({
    name: item.n,
    class: item.class || '',
    pc: item.pc,
  }));

  await setFile115List(list);
};

export const cache115Pic = async (paths?: string[]) => {
  const sdk = await getCloud115Sdk();
  const cidList = paths ? paths : ['3068034200407132056', '2823447377226661136'];
  const limit = 500;
  const timer = 3000;
  const start = Date.now();
  let resultNum = 0;
  log.info('开始缓存图片');

  const getPicFileList = async (cid: string) => {
    const result = await sdk.getFileList(0, 1, cid);
    const count = result.count;
    const nextCidList: string[] = [];

    for (let i = 0; i < count; i += limit) {
      const dataList: Cloud115FileListItem[] = [];
      const nowResult = await sdk.getFileList(i, limit, cid);
      const fileList = nowResult.data as Cloud115FileListItem[];

      fileList.forEach(item => {
        if (item.fid && item.class === 'PIC') {
          resultNum++;
          dataList.push(item);
        }
        if (!item.fid) {
          nextCidList.push(item.cid);
        }
      });

      if (dataList.length > 0) {
        await saveFile115List(dataList);
      }

      await waitTime(timer);
    }

    for (let i = 0; i < nextCidList.length; i++) {
      await getPicFileList(nextCidList[i]);
    }
  };

  try {
    for (let i = 0; i < cidList.length; i++) {
      await getPicFileList(cidList[i]);
    }

    const end = Date.now();
    log.info('缓存图片完成,耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
  } finally {
    await clearConfig(AppConfigEnum.is_115_picture_caching);
  }
};

export async function getRandom115PicMeta(userAgent: string): Promise<RandomPicMeta> {
  const len = await getFile115Len();
  const index = generateRandomNumber(0, len);
  const fileInfo = await getFile115ByIndex(index);
  const pc = fileInfo?.pc;
  const result = await get115FileData(pc as string, userAgent);
  const metaInfo = Object.values(result)[0] as
    | {
        url?: {
          url?: string;
        };
        file_name?: string;
      }
    | undefined;
  const url = metaInfo?.url?.url;
  const fileName = metaInfo?.file_name || 'unkonwn.jpg';
  return {
    url: url || '',
    fileName,
  };
}

export async function get115PicInfoData() {
  const count = await getFile115Len();
  const picConfig = await getConfig([AppConfigEnum.is_115_picture_caching, AppConfigEnum.picture_115_cids]);

  return {
    count,
    paths: picConfig?.picture_115_cids?.split(',') || [],
    loading: picConfig?.is_115_picture_caching === 'true',
  };
}

export async function set115PicInfoData(params: PicInfoParams) {
  const { paths } = params;
  if (!paths || paths.length === 0) {
    badRequest('参数错误');
  }

  const picConfig = await getConfig(AppConfigEnum.is_115_picture_caching);
  if (picConfig?.is_115_picture_caching === 'true') {
    badRequest('正在缓存中，请稍后再试');
  }

  await setConfig(AppConfigEnum.is_115_picture_caching, 'true');
  void cache115Pic(paths);

  const configs = await getConfig(AppConfigEnum.is_115_picture_caching);
  const before = configs?.picture_115_cids?.split(',') ?? [];
  const resultPath = before.concat(paths);
  await setConfig(AppConfigEnum.picture_115_cids, resultPath.join(','));

  return {
    paths: resultPath,
    loading: true,
  };
}

export async function clear115PicData() {
  await clearAllFile115();
  await clearConfig([AppConfigEnum.is_115_picture_caching, AppConfigEnum.picture_115_cids]);
  return 'success';
}
