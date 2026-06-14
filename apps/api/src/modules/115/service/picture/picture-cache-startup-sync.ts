import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { log } from '../../../../utils/logger';
import { File115Model } from '../../model/file115.model';
import { UserModel } from '../../../user/model/user.model';
import { get115OriginalCacheDir } from './picture-cache-path';
import { cleanupOrphanUnifiedCacheFiles } from './picture-cache-unified';

type FileCacheRow = {
  userId: string | null;
  pc: string | null;
  localCacheFileName: string | null;
};

type UserDirRow = {
  id: string | null;
};

const getUnifiedCacheDirByUserId = (userId: string) => {
  return get115OriginalCacheDir(userId);
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
    const users = (await UserModel.findAll({
      attributes: ['id'],
      raw: true,
    })) as unknown as UserDirRow[];

    if (rows.length === 0 && users.length === 0) {
      return;
    }

    const missingPcMap = new Map<string, string[]>();
    const validLocalCacheFileNameSetByUser = new Map<string, Set<string>>();

    await Promise.all(
      rows.map(async row => {
        const userId = String(row.userId || '').trim();
        const pc = String(row.pc || '').trim();
        const localCacheFileName = String(row.localCacheFileName || '').trim();
        if (!userId || !pc || !localCacheFileName) {
          return;
        }
        const validLocalCacheFileNameSet = validLocalCacheFileNameSetByUser.get(userId) || new Set<string>();
        validLocalCacheFileNameSet.add(localCacheFileName);
        validLocalCacheFileNameSetByUser.set(userId, validLocalCacheFileNameSet);

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
    let removedCacheFileCount = 0;
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

    users.forEach(row => {
      const userId = String(row.id || '').trim();
      if (!userId || validLocalCacheFileNameSetByUser.has(userId)) {
        return;
      }
      validLocalCacheFileNameSetByUser.set(userId, new Set<string>());
    });

    await Promise.all(
      Array.from(validLocalCacheFileNameSetByUser.entries()).map(async ([userId, fileNameSet]) => {
        const cleanupResult = await cleanupOrphanUnifiedCacheFiles(fileNameSet, getUnifiedCacheDirByUserId(userId));
        removedCacheFileCount += cleanupResult.removedCount;
      })
    );

    log.info('[115-cache] 启动缓存索引同步完成', {
      scannedCount: rows.length,
      clearedCount,
      removedCacheFileCount,
      userCount: missingPcMap.size,
    });
  } catch (error) {
    log.error('[115-cache] 启动缓存索引同步失败', error);
  }
};
