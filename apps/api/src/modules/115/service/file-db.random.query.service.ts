import { literal, Op } from 'sequelize';
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

export const getFile115RandomByCidListExcludePc = async (cidList: string[], excludedPcList: string[] = []) => {
  if (cidList.length === 0) {
    return undefined;
  }

  const excluded = Array.from(new Set(excludedPcList.map(item => String(item || '').trim()).filter(Boolean)));
  const where =
    excluded.length > 0
      ? {
          cid: {
            [Op.in]: cidList,
          },
          pc: {
            [Op.notIn]: excluded,
          },
        }
      : {
          cid: {
            [Op.in]: cidList,
          },
        };

  const result = await File115Model.findOne({
    where,
    order: literal('RANDOM()'),
  });

  return normalizeCloud115DbFileItem(result?.dataValues);
};
