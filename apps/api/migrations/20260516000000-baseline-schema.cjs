'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('volix_user', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      email_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      nickname: { type: Sequelize.STRING, allowNull: true },
      avatar: { type: Sequelize.STRING, allowNull: true },
      password: { type: Sequelize.STRING, allowNull: true },
      role: { type: Sequelize.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
      role_key: { type: Sequelize.STRING, allowNull: false, defaultValue: 'default' },
      account_list: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      rss_config: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      settings_json: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('volix_system_setting', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      setting_key: { type: Sequelize.STRING, allowNull: false, unique: true },
      setting_value: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('volix_file', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      mime_type: { type: Sequelize.STRING, allowNull: true },
      size: { type: Sequelize.FLOAT, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: true },
      extension: { type: Sequelize.STRING, allowNull: true },
      storage: { type: Sequelize.STRING, allowNull: false, defaultValue: 'local' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'normal' },
      uuid: { type: Sequelize.STRING, allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('volix_115_file', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      pc: { type: Sequelize.STRING, allowNull: false },
      class: { type: Sequelize.STRING, allowNull: true },
      cid: { type: Sequelize.STRING, allowNull: true },
      parent_cid: { type: Sequelize.STRING, allowNull: true },
      full_path: { type: Sequelize.STRING, allowNull: true },
      is_liked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      local_cache_file_name: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "volix_115_file_user_pc_uq_idx" ON "volix_115_file" ("user_id", "pc")'
    );
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "volix_115_file_user_full_path_uq_idx" ON "volix_115_file" ("user_id", "full_path") WHERE "full_path" IS NOT NULL AND "full_path" <> \'\''
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "volix_115_file_user_cid_idx" ON "volix_115_file" ("user_id", "cid")'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "volix_115_file_user_parent_cid_idx" ON "volix_115_file" ("user_id", "parent_cid")'
    );

    await queryInterface.createTable('volix_115_file_segment', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      pc: { type: Sequelize.STRING, allowNull: false },
      cid: { type: Sequelize.STRING, allowNull: true },
      segment: { type: Sequelize.STRING, allowNull: false },
      depth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "volix_115_file_segment_user_pc_segment_uq_idx" ON "volix_115_file_segment" ("user_id", "pc", "segment")'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "volix_115_file_segment_user_segment_idx" ON "volix_115_file_segment" ("user_id", "segment")'
    );

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
      is_subscribed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('volix_user_rss_feed_subscribe', ['user_id', 'route'], {
      unique: true,
      name: 'idx_volix_user_rss_feed_subscribe_user_route_unique',
    });
    await queryInterface.addIndex('volix_user_rss_feed_subscribe', ['user_id', 'is_subscribed', 'updated_at'], {
      name: 'idx_volix_user_rss_feed_subscribe_user_subscribed_updated_at',
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
      description_html_file_key: { type: Sequelize.STRING, allowNull: true },
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
      'idx_volix_user_rss_feed_subscribe_user_subscribed_updated_at'
    );
    await queryInterface.removeIndex(
      'volix_user_rss_feed_subscribe',
      'idx_volix_user_rss_feed_subscribe_user_route_unique'
    );
    await queryInterface.dropTable('volix_user_rss_feed_subscribe');

    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "volix_115_file_segment_user_segment_idx"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "volix_115_file_segment_user_pc_segment_uq_idx"');
    await queryInterface.dropTable('volix_115_file_segment');

    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "volix_115_file_user_parent_cid_idx"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "volix_115_file_user_cid_idx"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "volix_115_file_user_full_path_uq_idx"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "volix_115_file_user_pc_uq_idx"');
    await queryInterface.dropTable('volix_115_file');

    await queryInterface.dropTable('volix_file');
    await queryInterface.dropTable('volix_system_setting');
    await queryInterface.dropTable('volix_user');
  },
};
