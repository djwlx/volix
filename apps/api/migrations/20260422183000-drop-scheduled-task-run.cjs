'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('scheduled_task_run');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('scheduled_task_run', {
      id: { type: Sequelize.STRING(64), allowNull: false, primaryKey: true },
      task_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
        references: { model: 'scheduled_task', key: 'id' },
      },
      trigger_type: { type: Sequelize.STRING(32), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'queued' },
      started_at: { type: Sequelize.DATE, allowNull: true },
      finished_at: { type: Sequelize.DATE, allowNull: true },
      duration_ms: { type: Sequelize.INTEGER, allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      log_path: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
};
