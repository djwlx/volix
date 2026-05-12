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
  async up(queryInterface, Sequelize) {
    const tableName = await resolveCloud115FileTableName(queryInterface);
    const columns = await queryInterface.describeTable(tableName);

    if (!columns.is_liked) {
      await queryInterface.addColumn(tableName, 'is_liked', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${tableName}_is_liked_idx" ON "${tableName}" ("is_liked", "updated_at")`
    );
  },

  async down(queryInterface) {
    const tableName = await resolveCloud115FileTableName(queryInterface);
    const columns = await queryInterface.describeTable(tableName);

    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${tableName}_is_liked_idx"`);

    if (columns.is_liked) {
      await queryInterface.removeColumn(tableName, 'is_liked');
    }
  },
};
