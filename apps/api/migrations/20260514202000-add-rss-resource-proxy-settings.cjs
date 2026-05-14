'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user_rss_setting', 'resource_proxy_base_url', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('volix_user_rss_setting', 'resource_cache_max_size_mb', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 512,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('volix_user_rss_setting', 'resource_cache_max_size_mb');
    await queryInterface.removeColumn('volix_user_rss_setting', 'resource_proxy_base_url');
  },
};
