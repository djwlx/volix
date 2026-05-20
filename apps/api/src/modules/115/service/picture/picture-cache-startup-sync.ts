import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { PATH } from '../../../../utils/path';
import { log } from '../../../../utils/logger';
import { File115Model } from '../../model/file115.model';

type FileCacheRow = {
  userId: string | null;
  pc: string | null;
  localCacheFileName: string | null;
};

const normalizeScopeUserId = (userId: string) => {
  return String(userId || 'public').replace(/[^\w.-]/g, '_') || 'public';
};

const getUnifiedCacheDirByUserId = (userId: string) => {
  return path.join(PATH.cache, '115-file', normalizeScopeUserId(userId));
};

export const sync115FileCacheDbWithFsOnStartup = async () => {
  try {
    const rows = (await File115Model.findAll({
      attributes: ['userId', 'pc', 'localCacheFileName'],
      where: {
        localCacheFileName: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      },
      raw: true,
    })) as unknown as FileCacheRow[];

    if (rows.length === 0) {
      return;
    }

    const missingPcMap = new Map<string, string[]>();

    await Promise.all(
      rows.map(async row => {
        const userId = String(row.userId || '').trim();
        const pc = String(row.pc || '').trim();
        const localCacheFileName = String(row.localCacheFileName || '').trim();
        if (!userId || !pc || !localCacheFileName) {
          return;
        }

        const filePath = path.join(getUnifiedCacheDirByUserId(userId), localCacheFileName);
        try {
          await fs.promises.access(filePath, fs.constants.R_OK);
        } catch {
          const list = missingPcMap.get(userId) || [];
          list.push(pc);
          missingPcMap.set(userId, list);
        }
      })
    );

    let clearedCount = 0;
    await Promise.all(
      Array.from(missingPcMap.entries()).map(async ([userId, pcList]) => {
        const normalizedPcList = Array.from(new Set(pcList.map(item => item.trim()).filter(Boolean)));
        if (normalizedPcList.length === 0) {
          return;
        }
        const [affectedCount] = await File115Model.update(
          {
            localCacheFileName: null,
          },
          {
            where: {
              userId,
              pc: {
                [Op.in]: normalizedPcList,
              },
            },
          }
        );
        clearedCount += Number(affectedCount || 0);
      })
    );

    log.info('[115-cache] 启动缓存索引同步完成', {
      scannedCount: rows.length,
      clearedCount,
      userCount: missingPcMap.size,
    });
  } catch (error) {
    log.error('[115-cache] 启动缓存索引同步失败', error);
  }
};
