import { Op } from 'sequelize';
import { File115Model } from '../model/file115.model';
import type { Cloud115DbFileItem } from '../types/115.types';

export const getFile115Len = async () => {
  return File115Model.count();
};

export const getFile115ByIndex = async (index: number) => {
  const result = await File115Model.findOne({
    offset: index,
  });
  return result?.dataValues;
};

export const setFile115List = async (list: Cloud115DbFileItem[]) => {
  return File115Model.bulkCreate(list, {
    ignoreDuplicates: true,
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
