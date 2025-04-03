// 模型层，主要是一些实体的抽象，和数据库相关
import configModel from './config';
import userModel from './user';
import file115Model from './driver115';
import { log } from '../utils/logger';

export async function syncModels() {
  const syncPromises = [configModel.sync(), userModel.sync(), file115Model.sync()];
  try {
    await Promise.all(syncPromises);
  } catch (e) {
    log.error(e);
  }
}
