'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('anime_subscription', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      aliases: { type: Sequelize.TEXT, allowNull: false, defaultValue: '[]' },
      rss_url: { type: Sequelize.STRING, allowNull: false },
      series_root_path: { type: Sequelize.STRING, allowNull: false },
      qbit_save_path: { type: Sequelize.STRING, allowNull: false },
      openlist_download_path: { type: Sequelize.STRING, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      use_ai: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      match_keywords: { type: Sequelize.TEXT, allowNull: false, defaultValue: '[]' },
      rename_pattern: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '{{series}}/S{{season}}/E{{episode}}',
      },
      check_interval_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      last_checked_at: { type: Sequelize.DATE },
      last_success_at: { type: Sequelize.DATE },
      status: { type: Sequelize.ENUM('active', 'paused', 'error'), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('anime_subscription_item', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      subscription_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'anime_subscription',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rss_guid: { type: Sequelize.STRING },
      rss_title: { type: Sequelize.STRING, allowNull: false },
      detail_url: { type: Sequelize.STRING },
      torrent_url: { type: Sequelize.STRING },
      published_at: { type: Sequelize.DATE },
      season: { type: Sequelize.INTEGER },
      episode: { type: Sequelize.INTEGER },
      episode_raw: { type: Sequelize.STRING },
      resolution: { type: Sequelize.STRING },
      subtitle_language: { type: Sequelize.STRING },
      release_group: { type: Sequelize.STRING },
      score: { type: Sequelize.FLOAT },
      decision_status: {
        type: Sequelize.ENUM('pending', 'skipped', 'queued', 'downloading', 'downloaded', 'organized', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      qbit_hash: { type: Sequelize.STRING },
      target_path: { type: Sequelize.STRING },
      reason: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('anime_subscription_item');
    await queryInterface.dropTable('anime_subscription');
  },
};
