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

    if (!columns.parent_path) {
      await queryInterface.addColumn(tableName, 'parent_path', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!columns.full_path) {
      await queryInterface.addColumn(tableName, 'full_path', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableName = await resolveCloud115FileTableName(queryInterface);
    const columns = await queryInterface.describeTable(tableName);

    if (columns.full_path) {
      await queryInterface.removeColumn(tableName, 'full_path');
    }

    if (columns.parent_path) {
      await queryInterface.removeColumn(tableName, 'parent_path');
    }
  },
};
