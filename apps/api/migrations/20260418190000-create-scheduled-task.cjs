'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scheduled_task', {
      id: { type: Sequelize.STRING(64), allowNull: false, primaryKey: true },
      name: { type: Sequelize.STRING(128), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(32), allowNull: false },
      task_type: { type: Sequelize.STRING(32), allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      cron_expr: { type: Sequelize.STRING(128), allowNull: false },
      timezone: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'Asia/Shanghai' },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'idle' },
      last_run_at: { type: Sequelize.DATE, allowNull: true },
      next_run_at: { type: Sequelize.DATE, allowNull: true },
      last_success_at: { type: Sequelize.DATE, allowNull: true },
      last_error: { type: Sequelize.TEXT, allowNull: true },
      script_language: { type: Sequelize.STRING(32), allowNull: true },
      script_content: { type: Sequelize.TEXT('long'), allowNull: true },
      script_entry_args: { type: Sequelize.TEXT, allowNull: true },
      builtin_handler: { type: Sequelize.STRING(128), allowNull: true },
      builtin_payload: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.STRING(64), allowNull: true },
      updated_by: { type: Sequelize.STRING(64), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

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

  async down(queryInterface) {
    await queryInterface.dropTable('scheduled_task_run');
    await queryInterface.dropTable('scheduled_task');
  },
};
