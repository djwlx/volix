'use strict';

const TABLE_NAME = 'volix_format_convert_task';
const COLUMN_NAME = 'log_local_path';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);
    if (!table || table[COLUMN_NAME]) {
      return;
    }

    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);
    if (!table || !table[COLUMN_NAME]) {
      return;
    }

    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  },
};
