'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user_rss_setting', 'refresh_interval_minutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('volix_user_rss_setting', 'refresh_interval_minutes');
  },
};
