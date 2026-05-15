'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user_rss_feed_item', 'description_html_file_key', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('volix_user_rss_feed_item', 'description_html_file_key');
  },
};

