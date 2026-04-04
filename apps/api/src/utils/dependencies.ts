import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';
import sequelize from './sequelize';
import { AppFeature } from '@volix/types';
import { ConfigModel } from '../modules/config';
import { File115Model } from '../modules/115';
import { FileModel } from '../modules/file';
import { RoleModel, UserModel } from '../modules/user';
import { TaskModel } from '../modules/task';

const DEFAULT_USER_FEATURES: AppFeature[] = [AppFeature.RANDOM_PIC];

/**
 * 同步数据库表结构 - 只新增列，不删除已有列
 * 支持强制重建模式（需同时设置两个环境变量）
 */
const syncDatabase = async () => {
  const forceSync = process.env.DB_SYNC_FORCE === 'true';

  const models = [ConfigModel, UserModel, RoleModel, File115Model, FileModel, TaskModel];

  try {
    for (const model of models) {
      const option = forceSync ? { force: true } : { alter: true };
      await model.sync(option);
    }

    log.info('数据库表结构同步完成');
  } catch (error) {
    log.error('数据库表结构同步失败:', error);
    throw error;
  }
};

/**
 * 同步数据库数据 - 初始化和迁移数据
 * 包括初始化角色数据和时区转换
 */
const syncDatabaseData = async () => {
  try {
    // 1. 初始化默认角色
    const [role, created] = await RoleModel.findOrCreate({
      where: { role_key: 'default' },
      defaults: {
        role_key: 'default',
        role_name: '默认角色',
        features: JSON.stringify(DEFAULT_USER_FEATURES),
      },
    });

    if (created) {
      log.info('✓ 创建默认角色');
    } else {
      // 更新权限配置
      await role.update({ features: JSON.stringify(DEFAULT_USER_FEATURES) });
      log.info('✓ 更新默认角色权限');
    }

    // 2. 关联用户到默认角色
    const usersWithoutRole = await UserModel.count({
      where: sequelize.where(sequelize.fn('COALESCE', sequelize.col('role_key'), ''), '=', ''),
    });

    if (usersWithoutRole > 0) {
      await UserModel.update(
        { role_key: 'default' },
        {
          where: sequelize.where(sequelize.fn('COALESCE', sequelize.col('role_key'), ''), '=', ''),
        }
      );
      log.info(`✓ 关联 ${usersWithoutRole} 个无角色的用户到默认角色`);
    }

    log.info('数据库数据初始化完成');
  } catch (error) {
    log.warn('数据库数据同步出现问题:', error);
  }
};

const initApp = async () => {
  // 创建必要的目录
  const pathList = [
    { filePath: PATH.log, type: 'dir' },
    { filePath: PATH.upload, type: 'dir' },
  ];

  for (const { filePath, type } of pathList) {
    if (type === 'dir' && !fs.existsSync(filePath)) {
      log.info(`生成文件夹 ${filePath}`);
      fs.mkdirSync(filePath, { recursive: true });
    }
  }

  // 同步数据库结构和数据
  await syncDatabase();
  await syncDatabaseData();
};

export default initApp;
