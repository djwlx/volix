import { col, fn, literal, Op } from 'sequelize';
import { File115Model } from '../model/file115.model';
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

export const setFile115List = async (list: Cloud115DbFileItem[]) => {
  return File115Model.bulkCreate(list, {
    updateOnDuplicate: ['class', 'cid', 'parentCid', 'fullPath'],
  });
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

export const clearAllFile115 = async () => {
  return File115Model.destroy({
    where: {},
  });
};

export const clearFile115ByCidList = async (cidList: string[]) => {
  return File115Model.destroy({
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
  });
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
