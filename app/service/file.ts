import { FileModel } from '../model';

class FileService {
  static query = (param: any) => {
    return FileModel.findOne({ where: param });
  };

  static add = (param: any) => {
    return FileModel.create(param);
  };
}

const fileService = new FileService();
export { fileService };
