import { File115Model } from '../model';

class File115Service {
  async getFileLen() {
    const result = await File115Model.count();
    return result;
  }

  async getFileByIndex(index: number) {
    const result = await File115Model.findOne({
      offset: index,
    });
    return result?.dataValues;
  }

  async setFileList(list: any) {
    const result = await File115Model.bulkCreate(list, { ignoreDuplicates: true });
    return result;
  }
  async clearAll() {
    const result = await File115Model.destroy({
      where: {},
    });
    return result;
  }
}

const file115Service = new File115Service();

export { file115Service };
