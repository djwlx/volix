import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';
import sequelize from './sequelize';
import { UserRole, AppFeature } from '@volix/types';
import { ConfigModel } from '../modules/config';
import { File115Model } from '../modules/115';
import { FileModel } from '../modules/file';
import { RoleModel, UserModel } from '../modules/user';
import { TaskModel } from '../modules/task';

const DEFAULT_USER_FEATURES: AppFeature[] = [AppFeature.RANDOM_PIC];

const syncModels = async () => {
  const forceRequested = process.env.DB_SYNC_FORCE === 'true';
  const allowDestructive = process.env.ALLOW_DESTRUCTIVE_DB_SYNC === 'true';
  const forceSync = forceRequested && allowDestructive;
  if (forceRequested && !allowDestructive) {
    log.warn('检测到 DB_SYNC_FORCE=true，但未开启 ALLOW_DESTRUCTIVE_DB_SYNC，已忽略危险重建操作');
  }
  const syncOptions = {
    alter: process.env.DB_SYNC_ALTER ? process.env.DB_SYNC_ALTER === 'true' : process.env.NODE_ENV !== 'production',
    force: forceSync,
  };
  const models = [ConfigModel, UserModel, RoleModel, File115Model, FileModel, TaskModel];
  try {
    for (const model of models) {
      await model.sync(syncOptions);
    }
    log.info(`数据库模型同步完成: alter=${syncOptions.alter}, force=${syncOptions.force}`);
  } catch (error) {
    log.error('数据库模型同步失败:', error);
    throw error;
  }
};

const ensureRoleTableAndSeed = async () => {
  try {
    const now = new Date();
    await sequelize.query(
      `
      INSERT INTO app_role (role_key, role_name, features, created_at, updated_at)
      SELECT :roleKey, :roleName, :features, :now, :now
      WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE role_key = :roleKey)
      `,
      {
        replacements: {
          roleKey: 'default',
          roleName: '默认角色',
          features: JSON.stringify(DEFAULT_USER_FEATURES),
          now,
        },
      }
    );

    await sequelize.query(
      `
      UPDATE app_role
      SET features = :features, updated_at = :now
      WHERE role_key = :roleKey
      `,
      {
        replacements: {
          roleKey: 'default',
          features: JSON.stringify(DEFAULT_USER_FEATURES),
          now,
        },
      }
    );

    await sequelize.query(
      `
      UPDATE app_user
      SET role_key = 'default'
      WHERE role_key IS NULL OR role_key = ''
      `
    );

    await sequelize.query(
      `
      UPDATE app_user
      SET role_key = 'default'
      WHERE role = :userRole AND role_key = 'default'
      `,
      {
        replacements: {
          userRole: UserRole.USER,
        },
      }
    );
  } catch (error) {
    log.warn('角色默认数据初始化时跳过:', error);
  }
};

const normalizeSqliteTimestampsToBeijing = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const tables = await queryInterface.showAllTables();
    const queryGenerator = (
      queryInterface as unknown as {
        queryGenerator: { quoteTable: (value: string) => string; quoteIdentifier: (value: string) => string };
      }
    ).queryGenerator;
    const tableNames = tables
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        return (item as { tableName?: string; name?: string }).tableName || (item as { name?: string }).name || '';
      })
      .filter(Boolean)
      .filter(name => name !== 'sqlite_sequence');

    let updatedCount = 0;

    for (const tableName of tableNames) {
      const quotedTable = queryGenerator.quoteTable(tableName);
      const columns = await queryInterface.describeTable(tableName);
      const timestampColumns = Object.keys(columns).filter(columnName => columnName.endsWith('_at'));
      for (const columnName of timestampColumns) {
        const quotedColumn = queryGenerator.quoteIdentifier(columnName);
        const [, result] = await sequelize.query(
          `
          UPDATE ${quotedTable}
          SET ${quotedColumn} = strftime('%Y-%m-%d %H:%M:%f', ${quotedColumn}, '+8 hours') || ' +08:00'
          WHERE ${quotedColumn} LIKE '% +00:00'
          `
        );
        const changes =
          typeof result === 'object' && result && 'changes' in result
            ? Number((result as { changes?: number }).changes)
            : 0;
        updatedCount += Number.isFinite(changes) ? changes : 0;
      }
    }

    if (updatedCount > 0) {
      log.info(`数据库时区统一完成：共转换 ${updatedCount} 条 UTC 时间为北京时间`);
    }
  } catch (error) {
    log.warn('数据库时区统一跳过:', error);
  }
};

const initApp = async () => {
  // // 生成必要的文件夹
  const pathList = [
    {
      filePath: PATH.log,
      type: 'dir',
    },
    {
      filePath: PATH.upload,
      type: 'dir',
    },
  ];

  for (const pathItem of pathList) {
    const { filePath, type } = pathItem;
    if (type === 'dir') {
      if (!fs.existsSync(filePath)) {
        log.info(`生成文件夹 ${filePath}`);
        fs.mkdirSync(filePath, { recursive: true });
      }
    }
  }

  await syncModels();
  await ensureRoleTableAndSeed();
  await normalizeSqliteTimestampsToBeijing();
};

export default initApp;
