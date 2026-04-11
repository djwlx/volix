import type {
  ClearPicInfoParams,
  FileListDataItem,
  Like115PicParams,
  PicCacheFolderItem,
  PicInfoParams,
  RetryPicInfoParams,
} from '@volix/types';
import { AppConfigEnum } from '../../config/model/config.model';
import { clearConfig, getConfig, setConfig } from '../../config/service/config.service';
import { badRequest } from '../../shared/http-handler';
import { calculateTimeDifference, waitTime } from '../../../utils/date';
import { lightLocks } from '../../../utils/light-lock';
import { log } from '../../../utils/logger';
import { generateRandomNumber } from '../../../utils/number';
import { Cloud115DbFileItem, RandomPicMeta } from '../types/115.types';
import { get115FileData } from './file.service';
import {
  clearAllFile115,
  clearFile115ByCidList,
  getFile115ByCidIndex,
  getFile115ByPc,
  getFile115CountByCid,
  getFile115Len,
  setFile115List,
} from './file-db.service';
import { getCloud115Sdk } from './sdk.service';

type Cloud115FileListItem = FileListDataItem & {
  class?: string;
};

const saveFile115List = async (dataList: Cloud115FileListItem[], cid: string) => {
  const list: Cloud115DbFileItem[] = dataList.map(item => ({
    name: item.n,
    class: item.class || '',
    pc: item.pc,
    cid,
  }));

  await setFile115List(list);
};

let cacheQueueRunner: Promise<void> | null = null;
let folderConfigLock = Promise.resolve();

const withFolderConfigLock = async <T>(task: () => Promise<T>) => {
  const run = folderConfigLock.then(task, task);
  folderConfigLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const normalizePaths = (paths?: string[]) => {
  return (paths || []).map(path => path.trim()).filter(Boolean);
};

const nowIso = () => new Date().toISOString();
const PIC_RANDOM_WEIGHT_INCREMENT = 0.2;
const PIC_RANDOM_WEIGHT_CAP = 0.5;

const getPicCacheFolders = async (): Promise<PicCacheFolderItem[]> => {
  const config = await getConfig(AppConfigEnum.picture_115_folders);
  const raw = config?.picture_115_folders;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PicCacheFolderItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(item => ({
        cid: String(item.cid || '').trim(),
        status: item.status,
        errorMessage: item.errorMessage,
        updatedAt: item.updatedAt,
      }))
      .filter(item => item.cid);
  } catch (error) {
    log.error('解析 115 图片缓存目录配置失败', error);
    return [];
  }
};

const savePicCacheFolders = async (folders: PicCacheFolderItem[]) => {
  if (folders.length === 0) {
    await clearConfig([AppConfigEnum.picture_115_folders, AppConfigEnum.picture_115_cids]);
    return;
  }

  await setConfig(
    AppConfigEnum.picture_115_folders,
    JSON.stringify(
      folders.map(item => ({
        cid: item.cid,
        status: item.status,
        errorMessage: item.errorMessage,
        updatedAt: item.updatedAt,
      }))
    )
  );
  await setConfig(AppConfigEnum.picture_115_cids, folders.map(item => item.cid).join(','));
};

const getPicRandomWeightMap = async () => {
  const config = await getConfig(AppConfigEnum.picture_115_random_weights);
  const raw = config?.picture_115_random_weights;
  if (!raw) {
    return {} as Record<string, number>;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.entries(parsed).reduce((acc, [cid, value]) => {
      if (!cid.trim()) {
        return acc;
      }
      const score = Number(value);
      acc[cid] = Number.isFinite(score) && score > 0 ? score : 1;
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    log.error('解析 115 图片随机权重失败', error);
    return {};
  }
};

const savePicRandomWeightMap = async (weightMap: Record<string, number>) => {
  const cleaned = Object.entries(weightMap).reduce((acc, [cid, value]) => {
    if (!cid.trim()) {
      return acc;
    }
    const score = Number(value);
    if (!Number.isFinite(score) || score <= 0) {
      return acc;
    }
    acc[cid] = Number(score.toFixed(4));
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(cleaned).length === 0) {
    await clearConfig(AppConfigEnum.picture_115_random_weights);
    return;
  }

  await setConfig(AppConfigEnum.picture_115_random_weights, JSON.stringify(cleaned));
};

const buildCappedProbabilities = (items: Array<{ cid: string; score: number }>) => {
  if (items.length === 0) {
    return [] as Array<{ cid: string; probability: number }>;
  }

  if (items.length === 1) {
    return [{ cid: items[0].cid, probability: 1 }];
  }

  const cap = PIC_RANDOM_WEIGHT_CAP;
  const scores = items.map(item => ({ ...item, probability: 0 }));
  const capped = new Set<string>();

  while (true) {
    const uncapped = scores.filter(item => !capped.has(item.cid));
    const cappedTotal = scores.filter(item => capped.has(item.cid)).reduce((sum, item) => sum + item.probability, 0);
    const remain = 1 - cappedTotal;

    if (uncapped.length === 0 || remain <= 0) {
      break;
    }

    const scoreTotal = uncapped.reduce((sum, item) => sum + item.score, 0) || uncapped.length;
    let overflow = false;

    uncapped.forEach(item => {
      item.probability = (item.score / scoreTotal) * remain;
    });

    uncapped.forEach(item => {
      if (item.probability > cap) {
        item.probability = cap;
        capped.add(item.cid);
        overflow = true;
      }
    });

    if (!overflow) {
      break;
    }
  }

  const total = scores.reduce((sum, item) => sum + item.probability, 0);
  if (total <= 0) {
    const equal = 1 / scores.length;
    return scores.map(item => ({ cid: item.cid, probability: equal }));
  }

  return scores.map(item => ({
    cid: item.cid,
    probability: item.probability / total,
  }));
};

const pickWeightedCid = (items: Array<{ cid: string; score: number }>) => {
  const probabilities = buildCappedProbabilities(items);
  let random = Math.random();

  for (let i = 0; i < probabilities.length; i++) {
    random -= probabilities[i].probability;
    if (random <= 0) {
      return probabilities[i].cid;
    }
  }

  return probabilities[probabilities.length - 1]?.cid || '';
};

const cache115PicByCid = async (cid: string) => {
  const limit = 500;
  const timer = 3000;
  const start = Date.now();
  let resultNum = 0;
  log.info('开始缓存图片目录', cid);
  const sdk = await getCloud115Sdk();

  const getPicFileList = async (currentCid: string, rootCid: string) => {
    const result = await sdk.getFileList(0, 1, currentCid);
    const count = result.count;
    const nextCidList: string[] = [];

    for (let i = 0; i < count; i += limit) {
      const dataList: Cloud115FileListItem[] = [];
      const nowResult = await sdk.getFileList(i, limit, currentCid);
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
        await saveFile115List(dataList, rootCid);
      }

      await waitTime(timer);
    }

    for (let i = 0; i < nextCidList.length; i++) {
      await getPicFileList(nextCidList[i], rootCid);
    }
  };

  await getPicFileList(cid, cid);

  const end = Date.now();
  log.info('缓存图片目录完成, cid:', cid, '耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
};

const ensure115PicQueueRunning = async () => {
  if (cacheQueueRunner) {
    return cacheQueueRunner;
  }

  cacheQueueRunner = (async () => {
    try {
      while (true) {
        const nextCid = await withFolderConfigLock(async () => {
          const folders = await getPicCacheFolders();
          const nextItem = folders.find(item => item.status === 'pending');
          if (!nextItem) {
            await clearConfig(AppConfigEnum.is_115_picture_caching);
            lightLocks.is115PictureCaching = false;
            return '';
          }

          nextItem.status = 'caching';
          nextItem.errorMessage = '';
          nextItem.updatedAt = nowIso();
          await savePicCacheFolders(folders);
          await setConfig(AppConfigEnum.is_115_picture_caching, 'true');
          lightLocks.is115PictureCaching = true;
          return nextItem.cid;
        });

        if (!nextCid) {
          return;
        }

        try {
          await cache115PicByCid(nextCid);
          await withFolderConfigLock(async () => {
            const folders = await getPicCacheFolders();
            const current = folders.find(item => item.cid === nextCid);
            if (current) {
              current.status = 'cached';
              current.errorMessage = '';
              current.updatedAt = nowIso();
              await savePicCacheFolders(folders);
            }
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '缓存失败';
          log.error('缓存 115 图片目录失败', nextCid, error);
          await withFolderConfigLock(async () => {
            const folders = await getPicCacheFolders();
            const current = folders.find(item => item.cid === nextCid);
            if (current) {
              current.status = 'failed';
              current.errorMessage = message;
              current.updatedAt = nowIso();
              await savePicCacheFolders(folders);
            }
          });
        }
      }
    } finally {
      cacheQueueRunner = null;
      lightLocks.is115PictureCaching = false;
      await clearConfig(AppConfigEnum.is_115_picture_caching);
    }
  })();

  return cacheQueueRunner;
};

export async function getRandom115PicMeta(userAgent: string): Promise<RandomPicMeta> {
  const [folders, cidCountMap, weightMap] = await Promise.all([
    getPicCacheFolders(),
    getFile115CountByCid(),
    getPicRandomWeightMap(),
  ]);

  const availableFolders = folders
    .filter(item => item.status === 'cached')
    .map(item => ({
      cid: item.cid,
      count: cidCountMap[item.cid] || 0,
      score: weightMap[item.cid] ?? 1,
    }))
    .filter(item => item.count > 0);

  if (availableFolders.length === 0) {
    badRequest('暂无缓存图片，请先缓存');
  }

  const targetCid = pickWeightedCid(
    availableFolders.map(item => ({
      cid: item.cid,
      score: item.score,
    }))
  );
  const targetFolder = availableFolders.find(item => item.cid === targetCid) || availableFolders[0];
  const index = generateRandomNumber(0, targetFolder.count - 1);
  const fileInfo = await getFile115ByCidIndex(targetFolder.cid, index);
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
    cid: fileInfo?.cid || targetFolder.cid,
    pc: safePc,
  };
}

export async function get115PicInfoData() {
  const [picConfig, folders, cidCountMap, count] = await Promise.all([
    getConfig(AppConfigEnum.is_115_picture_caching),
    getPicCacheFolders(),
    getFile115CountByCid(),
    getFile115Len(),
  ]);

  return {
    count,
    folders: folders.map(item => ({
      ...item,
      count: cidCountMap[item.cid] || 0,
    })),
    loading: picConfig?.is_115_picture_caching === 'true',
  };
}

export async function set115PicInfoData(params: PicInfoParams) {
  const normalizedPaths = normalizePaths(params.paths);
  if (normalizedPaths.length === 0) {
    badRequest('参数错误');
  }

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    const folderMap = new Map(folders.map(item => [item.cid, item]));

    normalizedPaths.forEach(cid => {
      if (folderMap.has(cid)) {
        return;
      }

      folders.push({
        cid,
        status: 'pending',
        updatedAt: nowIso(),
      });
    });

    await savePicCacheFolders(folders);
  });

  void ensure115PicQueueRunning();
  return get115PicInfoData();
}

export async function clear115PicData(params?: ClearPicInfoParams) {
  const normalizedPaths = normalizePaths(params?.paths);
  if (normalizedPaths.length === 0) {
    if (lightLocks.is115PictureCaching) {
      badRequest('正在缓存中，请稍后再试');
    }
    await clearAllFile115();
    await clearConfig([
      AppConfigEnum.is_115_picture_caching,
      AppConfigEnum.picture_115_cids,
      AppConfigEnum.picture_115_folders,
      AppConfigEnum.picture_115_random_weights,
    ]);
    lightLocks.is115PictureCaching = false;
    return 'success';
  }

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    const weightMap = await getPicRandomWeightMap();
    const activeFolders = folders.filter(
      item => normalizedPaths.includes(item.cid) && (item.status === 'pending' || item.status === 'caching')
    );
    if (activeFolders.length > 0) {
      badRequest('请等待该缓存任务完成后再删除');
    }

    const remainFolders = folders.filter(item => !normalizedPaths.includes(item.cid));
    normalizedPaths.forEach(cid => {
      delete weightMap[cid];
    });
    await clearFile115ByCidList(normalizedPaths);
    await savePicCacheFolders(remainFolders);
    await savePicRandomWeightMap(weightMap);
  });

  return get115PicInfoData();
}

export async function retry115PicData(params: RetryPicInfoParams) {
  const normalizedPaths = normalizePaths(params.paths);
  if (normalizedPaths.length === 0) {
    badRequest('参数错误');
  }

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    let changed = false;

    folders.forEach(item => {
      if (normalizedPaths.includes(item.cid) && item.status === 'failed') {
        item.status = 'pending';
        item.errorMessage = '';
        item.updatedAt = nowIso();
        changed = true;
      }
    });

    if (!changed) {
      badRequest('未找到可重试的缓存目录');
    }

    await savePicCacheFolders(folders);
  });

  void ensure115PicQueueRunning();
  return get115PicInfoData();
}

export async function like115PicData(params: Like115PicParams) {
  const cid = params.cid?.trim() || '';
  const pc = params.pc?.trim() || '';

  let targetCid = cid;
  if (!targetCid && pc) {
    const file = await getFile115ByPc(pc);
    targetCid = file?.cid || '';
  }

  if (!targetCid) {
    badRequest('未找到图片所属目录');
  }

  return withFolderConfigLock(async () => {
    const [folders, weightMap] = await Promise.all([getPicCacheFolders(), getPicRandomWeightMap()]);
    const currentFolder = folders.find(item => item.cid === targetCid);
    if (!currentFolder || currentFolder.status !== 'cached') {
      badRequest('当前目录未处于可喜欢状态');
    }

    weightMap[targetCid] = Number(((weightMap[targetCid] ?? 1) + PIC_RANDOM_WEIGHT_INCREMENT).toFixed(4));
    await savePicRandomWeightMap(weightMap);

    return {
      cid: targetCid,
      weight: weightMap[targetCid],
    };
  });
}
