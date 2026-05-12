'use strict';

const resolveCloud115FileTableName = async queryInterface => {
  const tables = await queryInterface.showAllTables();
  const names = tables.map(item => (typeof item === 'string' ? item : item.tableName)).filter(Boolean);

  if (names.includes('volix_115_file')) {
    return 'volix_115_file';
  }

  if (names.includes('115_file')) {
    return '115_file';
  }

  throw new Error('找不到 115 文件表（volix_115_file / 115_file）');
};

module.exports = {
  async up(queryInterface) {
    const tableName = await resolveCloud115FileTableName(queryInterface);
    const indexName = `${tableName}_full_path_unique_idx`;
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("full_path") WHERE "full_path" IS NOT NULL AND "full_path" <> ''`
    );
  },

  async down(queryInterface) {
    const tableName = await resolveCloud115FileTableName(queryInterface);
    const indexName = `${tableName}_full_path_unique_idx`;
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${indexName}"`);
  },
};
