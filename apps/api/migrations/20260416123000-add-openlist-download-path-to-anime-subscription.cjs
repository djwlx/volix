'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('anime_subscription');
    if (!table.openlist_download_path) {
      await queryInterface.addColumn('anime_subscription', 'openlist_download_path', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('anime_subscription');
    if (table.openlist_download_path) {
      await queryInterface.removeColumn('anime_subscription', 'openlist_download_path');
    }
  },
};
