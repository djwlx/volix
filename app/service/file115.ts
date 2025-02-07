import file115Model from '../models/driver115';

class File115Service {
  async getFileLen() {
    const result = await file115Model.count();
    return result;
  }

  async getFileByIndex(index: number) {
    const result = await file115Model.findOne({
      offset: index,
    });
    return result?.dataValues;
  }

  async setFileList(list: any) {
    const result = await file115Model.bulkCreate(list, { ignoreDuplicates: true });
    return result;
  }
  async clearAll() {
    const result = await file115Model.destroy({
      where: {},
    });
    return result;
  }
}

export default new File115Service();
