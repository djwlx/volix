'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('anime_subscription', 'openlist_download_path', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('anime_subscription', 'openlist_download_path');
  },
};

