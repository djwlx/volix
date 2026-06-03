'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('volix_user_rss_feed_subscribe');
    if (!table.enabled) {
      await queryInterface.addColumn('volix_user_rss_feed_subscribe', 'enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
    const indexes = await queryInterface.showIndex('volix_user_rss_feed_subscribe');
    const indexName = 'idx_volix_user_rss_feed_subscribe_subscribed_enabled_updated_at';
    if (!indexes.some(index => index.name === indexName)) {
      await queryInterface.addIndex('volix_user_rss_feed_subscribe', ['is_subscribed', 'enabled', 'updated_at'], {
        name: indexName,
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('volix_user_rss_feed_subscribe');
    const indexName = 'idx_volix_user_rss_feed_subscribe_subscribed_enabled_updated_at';
    if (indexes.some(index => index.name === indexName)) {
      await queryInterface.removeIndex('volix_user_rss_feed_subscribe', indexName);
    }
    const table = await queryInterface.describeTable('volix_user_rss_feed_subscribe');
    if (table.enabled) {
      await queryInterface.removeColumn('volix_user_rss_feed_subscribe', 'enabled');
    }
  },
};
