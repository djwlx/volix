'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('volix_user_rss_feed_item');
    if (!table.resource_download_attempts) {
      await queryInterface.addColumn('volix_user_rss_feed_item', 'resource_download_attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('volix_user_rss_feed_item');
    if (table.resource_download_attempts) {
      await queryInterface.removeColumn('volix_user_rss_feed_item', 'resource_download_attempts');
    }
  },
};
