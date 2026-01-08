import { Sequelize } from 'sequelize';
import { baseLog, log } from './logger';
import path from 'path';
import { getRootPath } from './path';

const rootPath = getRootPath();
const dbPath = path.resolve(rootPath, 'data/index.db');
// 创建是同步的，执行数据库操作是异步的
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: sql => baseLog.info(sql),
  define: {
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

try {
  sequelize.authenticate().then(() => {});
} catch (error) {
  log.error('连接数据库错误', error);
}

export default sequelize;
