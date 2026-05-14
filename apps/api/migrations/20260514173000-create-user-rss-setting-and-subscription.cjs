'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('volix_user_rss_setting', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false, unique: true },
      host: { type: Sequelize.STRING, allowNull: false, defaultValue: 'https://rsshub.app' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('volix_user_rss_subscription', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      route: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('volix_user_rss_subscription', ['user_id', 'route'], {
      unique: true,
      name: 'idx_volix_user_rss_subscription_user_route_unique',
    });

    await queryInterface.addIndex('volix_user_rss_subscription', ['user_id', 'updated_at'], {
      name: 'idx_volix_user_rss_subscription_user_updated_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('volix_user_rss_subscription', 'idx_volix_user_rss_subscription_user_updated_at');
    await queryInterface.removeIndex(
      'volix_user_rss_subscription',
      'idx_volix_user_rss_subscription_user_route_unique'
    );
    await queryInterface.dropTable('volix_user_rss_subscription');
    await queryInterface.dropTable('volix_user_rss_setting');
  },
};
