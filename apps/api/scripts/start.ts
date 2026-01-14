import { ConfigModel, File115Model, FileModel, UserModel, TaskModel } from '../src/model';
import { log } from '../src/utils/logger';

// 数据库模型同步
async function syncModels() {
  const syncPromises = [ConfigModel.sync(), UserModel.sync(), File115Model.sync(), FileModel.sync(), TaskModel.sync()];
  try {
    await Promise.all(syncPromises);
    log.info('数据库模型同步成功');
  } catch (e) {
    log.error(e);
  }
}
syncModels();
