import type { FileListDataItem, PicInfoParams } from '@volix/types';
import { AppConfigEnum } from '../../config/model/config.model';
import { clearConfig, getConfig, setConfig } from '../../config/service/config.service';
import { badRequest } from '../../shared/http-handler';
import { calculateTimeDifference, waitTime } from '../../../utils/date';
import { lightLocks } from '../../../utils/light-lock';
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
  const cidList = paths ? paths : ['3068034200407132056', '2823447377226661136'];
  const limit = 500;
  const timer = 3000;
  const start = Date.now();
  let resultNum = 0;
  log.info('开始缓存图片');
  try {
    const sdk = await getCloud115Sdk();
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

    for (let i = 0; i < cidList.length; i++) {
      await getPicFileList(cidList[i]);
    }

    const end = Date.now();
    log.info('缓存图片完成,耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
  } finally {
    lightLocks.is115PictureCaching = false;
    await clearConfig(AppConfigEnum.is_115_picture_caching);
  }
};

export async function getRandom115PicMeta(userAgent: string): Promise<RandomPicMeta> {
  const len = await getFile115Len();
  if (len <= 0) {
    badRequest('暂无缓存图片，请先缓存');
  }
  const index = generateRandomNumber(0, len - 1);
  const fileInfo = await getFile115ByIndex(index);
  const pc = fileInfo?.pc;
  const safePc = pc || badRequest('暂无可用缓存图片，请稍后重试');
  const result = await get115FileData(safePc, userAgent);
  const metaInfo = Object.values(result)[0] as
    | {
        url?: {
          url?: string;
        };
        file_name?: string;
      }
    | undefined;
  const url = metaInfo?.url?.url;
  const fileName = metaInfo?.file_name || 'unknown.jpg';
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
  const normalizedPaths = (paths || []).map(path => path.trim()).filter(Boolean);
  if (normalizedPaths.length === 0) {
    badRequest('参数错误');
  }
  if (lightLocks.is115PictureCaching) {
    badRequest('正在缓存中，请稍后再试');
  }

  const picConfig = await getConfig(AppConfigEnum.is_115_picture_caching);
  if (picConfig?.is_115_picture_caching === 'true') {
    badRequest('正在缓存中，请稍后再试');
  }

  const configs = await getConfig(AppConfigEnum.picture_115_cids);
  const before = (configs?.picture_115_cids?.split(',') ?? []).map(path => path.trim()).filter(Boolean);
  const resultPath = Array.from(new Set([...before, ...normalizedPaths]));
  lightLocks.is115PictureCaching = true;

  try {
    await setConfig(AppConfigEnum.is_115_picture_caching, 'true');
    await setConfig(AppConfigEnum.picture_115_cids, resultPath.join(','));
    void cache115Pic(normalizedPaths);
  } catch (error) {
    lightLocks.is115PictureCaching = false;
    throw error;
  }

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
