'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('volix_user_rss_feed_subscribe', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      route: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: true },
      feed_url: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      link: { type: Sequelize.STRING, allowNull: true },
      last_fetched_at: { type: Sequelize.STRING, allowNull: true },
      last_processed_at: { type: Sequelize.STRING, allowNull: true },
      last_source_hash: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('volix_user_rss_feed_subscribe', ['user_id', 'route'], {
      unique: true,
      name: 'idx_volix_user_rss_feed_subscribe_user_route_unique',
    });

    await queryInterface.createTable('volix_user_rss_feed_item', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      route: { type: Sequelize.STRING, allowNull: false },
      item_key: { type: Sequelize.STRING, allowNull: false },
      item_id: { type: Sequelize.STRING, allowNull: true },
      title: { type: Sequelize.STRING, allowNull: true },
      link: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      description_html: { type: Sequelize.TEXT, allowNull: true },
      image_urls: { type: Sequelize.TEXT, allowNull: true },
      author: { type: Sequelize.STRING, allowNull: true },
      published_at: { type: Sequelize.STRING, allowNull: true },
      source_hash: { type: Sequelize.STRING, allowNull: true },
      resource_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      tags: { type: Sequelize.TEXT, allowNull: false, defaultValue: '[]' },
      fetched_at: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('volix_user_rss_feed_item', ['user_id', 'route', 'item_key'], {
      unique: true,
      name: 'idx_volix_user_rss_feed_item_user_route_item_key_unique',
    });
    await queryInterface.addIndex('volix_user_rss_feed_item', ['user_id', 'route', 'published_at'], {
      name: 'idx_volix_user_rss_feed_item_user_route_published_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'volix_user_rss_feed_item',
      'idx_volix_user_rss_feed_item_user_route_published_at'
    );
    await queryInterface.removeIndex(
      'volix_user_rss_feed_item',
      'idx_volix_user_rss_feed_item_user_route_item_key_unique'
    );
    await queryInterface.dropTable('volix_user_rss_feed_item');

    await queryInterface.removeIndex(
      'volix_user_rss_feed_subscribe',
      'idx_volix_user_rss_feed_subscribe_user_route_unique'
    );
    await queryInterface.dropTable('volix_user_rss_feed_subscribe');
  },
};
