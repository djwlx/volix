import { log } from '../../../utils/logger';
import { FileEntity, FileModel } from '../model/file.model';

export const saveFile = async (param: FileEntity) => {
  try {
    const result = await FileModel.create(param);
    return result.dataValues;
  } catch (e) {
    log.error(e);
  }
};

export const getFile = async (uuid: string) => {
  try {
    const findOne = await FileModel.findOne({
      where: {
        uuid,
      },
    });
    return findOne?.dataValues;
  } catch (e) {
    log.error(e);
  }
};
