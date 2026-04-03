import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';
import sequelize from './sequelize';
import { DataTypes } from 'sequelize';
import { UserRole, AppFeature } from '@volix/types';

const ensureUserTableColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const columns = await queryInterface.describeTable('app_user');
    if (!columns.avatar) {
      await queryInterface.addColumn('app_user', 'avatar', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      log.info('数据库迁移完成: app_user.avatar 已补齐');
    }
    if (!columns.role_key) {
      await queryInterface.addColumn('app_user', 'role_key', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'default',
      });
      log.info('数据库迁移完成: app_user.role_key 已补齐');
    }
  } catch (error) {
    log.warn('检查/迁移 app_user 表结构时跳过:', error);
  }
};

const ensureRoleTableAndSeed = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const tables = await queryInterface.showAllTables();
    const exists = tables.some(item => {
      if (typeof item === 'string') {
        return item === 'app_role';
      }
      const tableName = (item as { tableName?: string; name?: string }).tableName || (item as { name?: string }).name;
      return tableName === 'app_role';
    });
    if (!exists) {
      await queryInterface.createTable('app_role', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        role_key: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        role_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        features: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: '[]',
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });
      log.info('数据库迁移完成: app_role 表已创建');
    }

    const now = new Date();
    await queryInterface.sequelize.query(
      `
      INSERT INTO app_role (role_key, role_name, features, created_at, updated_at)
      SELECT :roleKey, :roleName, :features, :now, :now
      WHERE NOT EXISTS (SELECT 1 FROM app_role WHERE role_key = :roleKey)
      `,
      {
        replacements: {
          roleKey: 'default',
          roleName: '默认角色',
          features: JSON.stringify([AppFeature.ACCOUNT_115, AppFeature.RANDOM_PIC]),
          now,
        },
      }
    );

    await queryInterface.sequelize.query(
      `
      UPDATE app_user
      SET role_key = 'default'
      WHERE role_key IS NULL OR role_key = ''
      `
    );

    await queryInterface.sequelize.query(
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
    log.warn('检查/迁移 app_role 表结构时跳过:', error);
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

  await ensureUserTableColumns();
  await ensureRoleTableAndSeed();
};

export default initApp;
