import { FileModel } from '../model';
import { log } from '../utils/logger';

interface FileType {
  name: string;
  uuid: string;
  mime_type: string;
  size: number;
  path: string;
  extension: string;
  storage?: 'local';
  status?: 'normal' | 'deleted';
}

class FileService {
  saveFile = async (param: FileType) => {
    try {
      const result = await FileModel.create(param);
      return result.dataValues;
    } catch (e) {
      log.error(e);
    }
  };

  getFile = async (uuid: string) => {
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
}

const fileService = new FileService();
export { fileService, type FileType };
