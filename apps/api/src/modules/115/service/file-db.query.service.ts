import path from 'path';
import { col, fn, literal, Op } from 'sequelize';
import { File115Model } from '../model/file115.model';
import { File115PathSegmentModel } from '../model/file115-segment.model';
import type { Cloud115DbFileItem } from '../types/115.types';

const normalizeCloud115DbFileItem = (
  item?: {
    pc: string;
    class: string;
    cid: string | null;
    parentCid: string | null;
    fullPath: string | null;
    isLiked: boolean | number | null;
    localCacheFileName: string | null;
  } | null
) => {
  if (!item) {
    return undefined;
  }

  return {
    pc: item.pc,
    class: item.class,
    cid: item.cid || '',
    parentCid: item.parentCid || '',
    fullPath: item.fullPath || '',
    isLiked: Boolean(item.isLiked),
    localCacheFileName: String(item.localCacheFileName || '').trim(),
  } satisfies Cloud115DbFileItem;
};

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

const normalizeLocalCacheFileNameList = (rows: Array<{ localCacheFileName: string | null }>) => {
  return Array.from(new Set(rows.map(item => String(item.localCacheFileName || '').trim()).filter(Boolean)));
};

export const getFile115Len = async () => {
  return File115Model.count();
};

export const getFile115ByIndex = async (index: number) => {
  const result = await File115Model.findOne({
    offset: index,
  });
  return result?.dataValues;
};

export const getFile115ByCidIndex = async (cid: string, index: number) => {
  const result = await File115Model.findOne({
    where: {
      cid,
    },
    offset: index,
  });
  return normalizeCloud115DbFileItem(result?.dataValues);
};

export const getFile115ByPc = async (pc: string) => {
  const result = await File115Model.findOne({
    where: {
      pc,
    },
  });
  return normalizeCloud115DbFileItem(result?.dataValues);
};

export const getFile115PathByPc = async (pc: string) => {
  const result = await File115Model.findOne({
    where: {
      pc,
    },
    attributes: ['pc', 'cid', 'fullPath', 'isLiked', 'localCacheFileName'],
    raw: true,
  });

  if (!result) {
    return undefined;
  }

  const data = result as unknown as {
    pc: string;
    cid: string | null;
    fullPath: string | null;
    isLiked: boolean | number | null;
    localCacheFileName: string | null;
  };

  return {
    pc: data.pc,
    cid: String(data.cid || '').trim(),
    fullPath: String(data.fullPath || '').trim(),
    isLiked: Boolean(data.isLiked),
    localCacheFileName: String(data.localCacheFileName || '').trim(),
  };
};

export const getFile115ByCidParentCidIndex = async (cid: string, parentCid: string, index: number) => {
  const result = await File115Model.findOne({
    where: {
      cid,
      ...(parentCid === cid
        ? {
            [Op.or]: [{ parentCid }, { parentCid: null }],
          }
        : {
            parentCid,
          }),
    },
    offset: index,
  });
  return normalizeCloud115DbFileItem(result?.dataValues);
};

export const getFile115ByCidAndParentCid = async (cid: string, parentCid: string) => {
  const result = (await File115Model.findAll({
    where: {
      cid,
      ...(parentCid === cid
        ? {
            [Op.or]: [{ parentCid }, { parentCid: null }],
          }
        : {
            parentCid,
          }),
    },
    raw: true,
  })) as unknown as Array<{
    pc: string;
    class: string;
    cid: string | null;
    parentCid: string | null;
    fullPath: string | null;
    isLiked: boolean | number | null;
    localCacheFileName: string | null;
  }>;

  return result
    .map(item => normalizeCloud115DbFileItem(item))
    .filter((item): item is Cloud115DbFileItem => Boolean(item));
};

export const getFile115CachedParentCidSetByRootCid = async (rootCid: string) => {
  const result = (await File115Model.findAll({
    attributes: ['parentCid'],
    where: {
      cid: rootCid,
      parentCid: {
        [Op.not]: null,
      },
    },
    group: ['parent_cid'],
    raw: true,
  })) as unknown as Array<{ parentCid: string | null }>;

  return new Set(result.map(item => String(item.parentCid || '').trim()).filter(Boolean));
};

export const getFile115RandomByCidList = async (cidList: string[]) => {
  if (cidList.length === 0) {
    return undefined;
  }

  const result = await File115Model.findOne({
    where: {
      cid: {
        [Op.in]: cidList,
      },
    },
    order: literal('RANDOM()'),
  });

  return normalizeCloud115DbFileItem(result?.dataValues);
};

export const getLikedFile115List = async (offset = 0, pageSize = 100) => {
  const result = (await File115Model.findAll({
    where: {
      isLiked: true,
    },
    order: [
      ['updated_at', 'DESC'],
      ['id', 'DESC'],
    ],
    offset,
    limit: pageSize,
    raw: true,
  })) as unknown as Array<{
    pc: string;
    class: string;
    cid: string | null;
    parentCid: string | null;
    fullPath: string | null;
    isLiked: boolean | number | null;
    localCacheFileName: string | null;
  }>;

  return result
    .map(item => normalizeCloud115DbFileItem(item))
    .filter((item): item is Cloud115DbFileItem => Boolean(item));
};

export const getLikedFile115Count = async () => {
  return File115Model.count({
    where: {
      isLiked: true,
    },
  });
};

export const getAllFile115LocalCacheFileNameList = async () => {
  const result = (await File115Model.findAll({
    attributes: ['localCacheFileName'],
    where: {
      [Op.and]: [
        {
          localCacheFileName: {
            [Op.not]: null,
          },
        },
        {
          localCacheFileName: {
            [Op.ne]: '',
          },
        },
      ],
    },
    raw: true,
  })) as unknown as Array<{ localCacheFileName: string | null }>;

  return normalizeLocalCacheFileNameList(result);
};

export const getFile115LocalCacheFileNameListByCidList = async (cidList: string[]) => {
  if (cidList.length === 0) {
    return [] as string[];
  }

  const result = (await File115Model.findAll({
    attributes: ['localCacheFileName'],
    where: {
      [Op.and]: [
        {
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
        {
          localCacheFileName: {
            [Op.not]: null,
          },
        },
        {
          localCacheFileName: {
            [Op.ne]: '',
          },
        },
      ],
    },
    raw: true,
  })) as unknown as Array<{ localCacheFileName: string | null }>;

  return normalizeLocalCacheFileNameList(result);
};

export const getFile115LocalCacheFileNameListByFolderPathList = async (folderPathList: string[]) => {
  const normalizedFolderPathList = Array.from(
    new Set(folderPathList.map(item => normalizeFolderPath(item)).filter(item => item !== '/'))
  );
  if (normalizedFolderPathList.length === 0) {
    return [] as string[];
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
    return [] as string[];
  }

  const result = (await File115Model.findAll({
    attributes: ['localCacheFileName'],
    where: {
      [Op.and]: [
        {
          pc: {
            [Op.in]: targetPcList,
          },
        },
        {
          localCacheFileName: {
            [Op.not]: null,
          },
        },
        {
          localCacheFileName: {
            [Op.ne]: '',
          },
        },
      ],
    },
    raw: true,
  })) as unknown as Array<{ localCacheFileName: string | null }>;

  return normalizeLocalCacheFileNameList(result);
};

export const getFile115RootCidListByCidList = async (cidList: string[]) => {
  if (cidList.length === 0) {
    return [] as string[];
  }

  const result = (await File115Model.findAll({
    attributes: ['cid'],
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
    group: ['cid'],
    raw: true,
  })) as unknown as Array<{ cid: string | null }>;

  return Array.from(new Set(result.map(item => String(item.cid || '').trim()).filter(Boolean)));
};

export const getFile115RootCidListByFolderPathList = async (folderPathList: string[]) => {
  const normalizedFolderPathList = Array.from(
    new Set(folderPathList.map(item => normalizeFolderPath(item)).filter(item => item !== '/'))
  );
  if (normalizedFolderPathList.length === 0) {
    return [] as string[];
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
    return [] as string[];
  }

  const result = (await File115Model.findAll({
    attributes: ['cid'],
    where: {
      pc: {
        [Op.in]: targetPcList,
      },
    },
    group: ['cid'],
    raw: true,
  })) as unknown as Array<{ cid: string | null }>;

  return Array.from(new Set(result.map(item => String(item.cid || '').trim()).filter(Boolean)));
};

export const getFile115CountByCid = async () => {
  const result = (await File115Model.findAll({
    attributes: ['cid', [fn('COUNT', col('pc')), 'count']],
    group: ['cid'],
    raw: true,
  })) as unknown as Array<{ cid: string | null; count: number | string }>;

  return result.reduce((acc, item) => {
    const cid = String(item.cid || '');
    if (!cid) {
      return acc;
    }

    acc[cid] = Number(item.count || 0);
    return acc;
  }, {} as Record<string, number>);
};

export const getFile115ParentGroupByCidList = async (cidList: string[]) => {
  if (cidList.length === 0) {
    return [] as Array<{ cid: string; parentCid: string; count: number }>;
  }

  const result = (await File115Model.findAll({
    attributes: ['cid', 'parentCid', [fn('COUNT', col('pc')), 'count']],
    where: {
      cid: {
        [Op.in]: cidList,
      },
    },
    group: ['cid', 'parent_cid'],
    raw: true,
  })) as unknown as Array<{
    cid: string | null;
    parentCid: string | null;
    count: number | string;
  }>;

  return result.map(item => ({
    cid: String(item.cid || '').trim(),
    parentCid: String(item.parentCid || item.cid || '').trim(),
    count: Number(item.count || 0),
  }));
};

export const getFile115CachedCidList = async () => {
  const result = (await File115Model.findAll({
    attributes: ['cid', 'parentCid'],
    group: ['cid', 'parent_cid'],
    raw: true,
  })) as unknown as Array<{
    cid: string | null;
    parentCid: string | null;
  }>;

  const cidSet = new Set<string>();

  result.forEach(item => {
    const cid = String(item.cid || '').trim();
    const parentCid = String(item.parentCid || '').trim();
    if (cid) {
      cidSet.add(cid);
    }
    if (parentCid) {
      cidSet.add(parentCid);
    }
  });

  return Array.from(cidSet);
};

export const getFile115CachedFolderPathList = async () => {
  const result = (await File115PathSegmentModel.findAll({
    attributes: ['segment'],
    group: ['segment'],
    raw: true,
  })) as unknown as Array<{ segment: string | null }>;

  return Array.from(new Set(result.map(item => String(item.segment || '').trim()).filter(Boolean)));
};
