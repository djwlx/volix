import { ConfigModel } from '../src/modules/config';
import { File115Model } from '../src/modules/115';
import { FileModel } from '../src/modules/file';
import { RoleModel, UserModel } from '../src/modules/user';
import { TaskModel } from '../src/modules/task';
import { log } from '../src/utils/logger';

// 数据库模型同步
async function syncModels() {
  const syncPromises = [ConfigModel.sync(), UserModel.sync(), RoleModel.sync(), File115Model.sync(), FileModel.sync(), TaskModel.sync()];
  try {
    await Promise.all(syncPromises);
    log.info('数据库模型同步成功');
  } catch (e) {
    log.error(e);
  }
}
syncModels();
