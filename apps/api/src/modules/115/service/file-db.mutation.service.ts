import path from 'path';
import { Op } from 'sequelize';
import { File115Model } from '../model/file115.model';
import { File115PathSegmentModel } from '../model/file115-segment.model';
import type { Cloud115DbFileItem } from '../types/115.types';

const normalizeFolderPath = (folderPath: string) => {
  const normalized = path.posix.normalize(
    `/${String(folderPath || '')
      .trim()
      .replace(/^\/+/, '')}`
  );
  if (normalized === '/' || normalized === '.') {
    return '/';
  }
  return normalized.replace(/\/+$/, '');
};

const getFilePathSegments = (fullPath: string) => {
  const normalizedPath = normalizeFolderPath(fullPath);
  if (normalizedPath === '/') {
    return [] as string[];
  }

  const parentPath = path.posix.dirname(normalizedPath);
  if (!parentPath || parentPath === '/' || parentPath === '.') {
    return [] as string[];
  }

  const parts = parentPath.split('/').filter(Boolean);
  return parts.map((_, index) => `/${parts.slice(0, index + 1).join('/')}`);
};

const removeFile115PathSegmentsByPcList = async (pcList: string[]) => {
  const normalizedPcList = Array.from(new Set(pcList.map(item => String(item || '').trim()).filter(Boolean)));
  if (normalizedPcList.length === 0) {
    return;
  }

  await File115PathSegmentModel.destroy({
    where: {
      pc: {
        [Op.in]: normalizedPcList,
      },
    },
  });
};

const rebuildFile115PathSegments = async (list: Cloud115DbFileItem[]) => {
  const pcList = Array.from(new Set(list.map(item => String(item.pc || '').trim()).filter(Boolean)));
  if (pcList.length === 0) {
    return;
  }

  await removeFile115PathSegmentsByPcList(pcList);

  const segmentRows = list.flatMap(item => {
    const filePc = String(item.pc || '').trim();
    if (!filePc) {
      return [];
    }

    const fileCid = String(item.cid || '').trim();
    return getFilePathSegments(item.fullPath).map((segment, index) => ({
      pc: filePc,
      cid: fileCid,
      segment,
      depth: index + 1,
    }));
  });

  if (segmentRows.length > 0) {
    await File115PathSegmentModel.bulkCreate(segmentRows);
  }
};

const getExistingFile115ConflictRows = async (list: Cloud115DbFileItem[]) => {
  const pcList = Array.from(new Set(list.map(item => String(item.pc || '').trim()).filter(Boolean)));
  const fullPathList = Array.from(new Set(list.map(item => String(item.fullPath || '').trim()).filter(Boolean)));
  const whereList: Array<Record<string, unknown>> = [];

  if (pcList.length > 0) {
    whereList.push({
      pc: {
        [Op.in]: pcList,
      },
    });
  }

  if (fullPathList.length > 0) {
    whereList.push({
      fullPath: {
        [Op.in]: fullPathList,
      },
    });
  }

  if (whereList.length === 0) {
    return [] as Array<{
      pc: string | null;
      fullPath: string | null;
      isLiked: boolean | number | null;
      localCacheFileName: string | null;
    }>;
  }

  return (await File115Model.findAll({
    attributes: ['pc', 'fullPath', 'isLiked', 'localCacheFileName'],
    where: {
      [Op.or]: whereList,
    },
    raw: true,
  })) as unknown as Array<{
    pc: string | null;
    fullPath: string | null;
    isLiked: boolean | number | null;
    localCacheFileName: string | null;
  }>;
};

const mergeExistingFile115Policy = (
  list: Cloud115DbFileItem[],
  existingRows: Array<{
    pc: string | null;
    fullPath: string | null;
    isLiked: boolean | number | null;
    localCacheFileName: string | null;
  }>
) => {
  const existingByPc = new Map(existingRows.map(item => [String(item.pc || '').trim(), item]));
  const existingByFullPath = new Map(existingRows.map(item => [String(item.fullPath || '').trim(), item]));

  return list.map(item => {
    const existing =
      existingByPc.get(String(item.pc || '').trim()) || existingByFullPath.get(String(item.fullPath || '').trim());
    return {
      ...item,
      isLiked: item.isLiked || Boolean(existing?.isLiked),
      localCacheFileName: String(item.localCacheFileName || existing?.localCacheFileName || '').trim(),
    };
  });
};

const mergeFile115PolicyFields = (target: Cloud115DbFileItem, source: Cloud115DbFileItem) => ({
  ...target,
  isLiked: Boolean(target.isLiked || source.isLiked),
  localCacheFileName: String(target.localCacheFileName || source.localCacheFileName || '').trim(),
});

const dedupeFile115List = (list: Cloud115DbFileItem[]) => {
  const dedupedList: Cloud115DbFileItem[] = [];
  const indexByPc = new Map<string, number>();
  const indexByFullPath = new Map<string, number>();

  list.forEach(item => {
    const pc = String(item.pc || '').trim();
    const fullPath = String(item.fullPath || '').trim();
    const existingIndex = indexByPc.get(pc) ?? (fullPath ? indexByFullPath.get(fullPath) : undefined);

    if (existingIndex === undefined) {
      dedupedList.push(item);
      if (pc) {
        indexByPc.set(pc, dedupedList.length - 1);
      }
      if (fullPath) {
        indexByFullPath.set(fullPath, dedupedList.length - 1);
      }
      return;
    }

    dedupedList[existingIndex] = mergeFile115PolicyFields(dedupedList[existingIndex], item);
  });

  return dedupedList;
};

export const setFile115List = async (list: Cloud115DbFileItem[]) => {
  if (list.length === 0) {
    return [];
  }

  const existingRows = await getExistingFile115ConflictRows(list);
  const normalizedList = dedupeFile115List(mergeExistingFile115Policy(list, existingRows));
  const existingPcList = Array.from(new Set(existingRows.map(item => String(item.pc || '').trim()).filter(Boolean)));

  if (existingPcList.length > 0) {
    await removeFile115PathSegmentsByPcList(existingPcList);
    await File115Model.destroy({
      where: {
        pc: {
          [Op.in]: existingPcList,
        },
      },
    });
  }

  const result = await File115Model.bulkCreate(normalizedList);

  await rebuildFile115PathSegments(normalizedList);
  return result;
};

export const setFile115LikedByPc = async (pc: string, isLiked: boolean) => {
  return File115Model.update(
    {
      isLiked,
    },
    {
      where: {
        pc,
      },
    }
  );
};

export const setFile115LocalCacheFileNameByPc = async (pc: string, localCacheFileName: string | null) => {
  return File115Model.update(
    {
      localCacheFileName,
    },
    {
      where: {
        pc,
      },
    }
  );
};

export const clearAllFile115 = async () => {
  await File115PathSegmentModel.destroy({
    where: {},
  });

  return File115Model.destroy({
    where: {},
  });
};

export const clearFile115ByCidList = async (cidList: string[]) => {
  if (cidList.length === 0) {
    return 0;
  }

  const targetPcRows = (await File115Model.findAll({
    attributes: ['pc'],
    where: {
      [Op.or]: [
        {
          cid: {
            [Op.in]: cidList,
          },
        },
        {
          parentCid: {
            [Op.in]: cidList,
          },
        },
      ],
    },
    raw: true,
  })) as unknown as Array<{ pc: string | null }>;

  const targetPcList = Array.from(new Set(targetPcRows.map(item => String(item.pc || '').trim()).filter(Boolean)));

  if (targetPcList.length > 0) {
    await File115PathSegmentModel.destroy({
      where: {
        pc: {
          [Op.in]: targetPcList,
        },
      },
    });
  }

  if (targetPcList.length === 0) {
    return 0;
  }

  return File115Model.destroy({
    where: {
      pc: {
        [Op.in]: targetPcList,
      },
    },
  });
};

export const clearFile115ByFolderPathList = async (folderPathList: string[]) => {
  const normalizedFolderPathList = Array.from(
    new Set(folderPathList.map(item => normalizeFolderPath(item)).filter(item => item !== '/'))
  );
  if (normalizedFolderPathList.length === 0) {
    return 0;
  }

  const segmentPcRows = (await File115PathSegmentModel.findAll({
    attributes: ['pc'],
    where: {
      segment: {
        [Op.in]: normalizedFolderPathList,
      },
    },
    group: ['pc'],
    raw: true,
  })) as unknown as Array<{ pc: string | null }>;

  const targetPcList = Array.from(new Set(segmentPcRows.map(item => String(item.pc || '').trim()).filter(Boolean)));

  if (targetPcList.length === 0) {
    return 0;
  }

  const targetRows = (await File115Model.findAll({
    attributes: ['pc'],
    where: {
      pc: {
        [Op.in]: targetPcList,
      },
    },
    raw: true,
  })) as unknown as Array<{ pc: string | null }>;
  const normalizedTargetPcList = Array.from(
    new Set(targetRows.map(item => String(item.pc || '').trim()).filter(Boolean))
  );

  await File115PathSegmentModel.destroy({
    where: {
      pc: {
        [Op.in]: normalizedTargetPcList,
      },
    },
  });

  if (normalizedTargetPcList.length === 0) {
    return 0;
  }

  return File115Model.destroy({
    where: {
      pc: {
        [Op.in]: normalizedTargetPcList,
      },
    },
  });
};
