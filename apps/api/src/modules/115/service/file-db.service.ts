import { col, fn, Op } from 'sequelize';
import { File115Model } from '../model/file115.model';
import type { Cloud115DbFileItem } from '../types/115.types';

const normalizeCloud115DbFileItem = (
  item?: {
    pc: string;
    name: string;
    class: string;
    cid: string | null;
    parentCid: string | null;
  } | null
) => {
  if (!item) {
    return undefined;
  }

  return {
    pc: item.pc,
    name: item.name,
    class: item.class,
    cid: item.cid || '',
    parentCid: item.parentCid || '',
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
    name: string;
    class: string;
    cid: string | null;
    parentCid: string | null;
  }>;

  return result
    .map(item => normalizeCloud115DbFileItem(item))
    .filter((item): item is Cloud115DbFileItem => Boolean(item));
};

export const setFile115List = async (list: Cloud115DbFileItem[]) => {
  return File115Model.bulkCreate(list, {
    updateOnDuplicate: ['name', 'class', 'cid', 'parentCid'],
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
      cid: {
        [Op.in]: cidList,
      },
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
