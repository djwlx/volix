import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';
import sequelize from './sequelize';
import { Model, ModelStatic, Attributes } from 'sequelize';
import { UserRole, AppFeature } from '@volix/types';
import { ConfigModel } from '../modules/config';
import { File115Model } from '../modules/115';
import { FileModel } from '../modules/file';
import { RoleModel, UserModel } from '../modules/user';
import { TaskModel } from '../modules/task';

const DEFAULT_USER_FEATURES: AppFeature[] = [AppFeature.RANDOM_PIC];

/**
 * 同步单个模型的表结构
 */
const syncModelSchema = async (model: ModelStatic<Model>) => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = model.tableName || model.name;
  const tables = await queryInterface.showAllTables();

  // 表不存在，创建新表
  if (!tables.includes(tableName)) {
    await model.sync();
    log.info(`✓ 新建表: ${tableName}`);
    return;
  }

  // 表存在，同步新增列
  const dbColumns = await queryInterface.describeTable(tableName);
  const dbColumnNames = Object.keys(dbColumns);
  const modelAttributes = model.getAttributes();
  const modelColumnNames = Object.keys(modelAttributes);

  const columnsToAdd = modelColumnNames.filter(col => !dbColumnNames.includes(col));

  if (columnsToAdd.length > 0) {
    log.info(`表 ${tableName} 检测到 ${columnsToAdd.length} 个新列`);
    for (const columnName of columnsToAdd) {
      try {
        const attribute = modelAttributes[columnName];
        await queryInterface.addColumn(tableName, columnName, attribute);
        log.info(`  ✓ ${tableName}.${columnName}`);
      } catch (error) {
        log.warn(`  ✗ ${tableName}.${columnName}:`, error);
      }
    }
  }
};

/**
 * 同步数据库表结构 - 只新增列，不删除已有列
 * 支持强制重建模式（需同时设置两个环境变量）
 */
const syncDatabase = async () => {
  const forceRequested = process.env.DB_SYNC_FORCE === 'true';
  const allowDestructive = process.env.ALLOW_DESTRUCTIVE_DB_SYNC === 'true';
  const forceSync = forceRequested && allowDestructive;

  if (forceRequested && !allowDestructive) {
    log.warn('检测到 DB_SYNC_FORCE=true，但未开启 ALLOW_DESTRUCTIVE_DB_SYNC，已忽略危险重建操作');
  }

  const models = [ConfigModel, UserModel, RoleModel, File115Model, FileModel, TaskModel];

  try {
    // 强制重建模式
    if (forceSync) {
      for (const model of models) {
        await model.sync({ force: true });
      }
      log.info('数据库表结构强制重建完成');
      return;
    }

    // 安全模式：只新增列，保留旧列
    for (const model of models) {
      await syncModelSchema(model);
    }

    log.info('数据库表结构同步完成 (安全模式)');
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
    // 初始化默认角色和用户
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

    // 时区数据迁移：UTC 转换为北京时间
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const queryGenerator = (
      queryInterface as unknown as {
        queryGenerator: { quoteTable: (value: string) => string; quoteIdentifier: (value: string) => string };
      }
    ).queryGenerator;

    const tableNames = tables
      .map(item => {
        if (typeof item === 'string') return item;
        return (item as { tableName?: string; name?: string }).tableName || (item as { name?: string }).name || '';
      })
      .filter(Boolean)
      .filter(name => name !== 'sqlite_sequence');

    let convertedCount = 0;

    for (const tableName of tableNames) {
      const quotedTable = queryGenerator.quoteTable(tableName);
      const columns = await queryInterface.describeTable(tableName);
      const timestampColumns = Object.keys(columns).filter(col => col.endsWith('_at'));

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
        convertedCount += Number.isFinite(changes) ? changes : 0;
      }
    }

    if (convertedCount > 0) {
      log.info(`数据迁移完成: 转换 ${convertedCount} 条 UTC 时间为北京时间`);
    }
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
