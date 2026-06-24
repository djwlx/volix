'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable('volix_astrbot_push_task').catch(() => undefined);

    await queryInterface.createTable('volix_scheduled_task', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      type: { type: Sequelize.STRING, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      cron: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      params_json: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      last_run_at: { type: Sequelize.DATE, allowNull: true },
      last_run_status: { type: Sequelize.STRING, allowNull: true },
      last_run_error: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('volix_scheduled_task', ['user_id'], {
      name: 'idx_volix_scheduled_task_user',
    });
    await queryInterface.addIndex('volix_scheduled_task', ['enabled'], {
      name: 'idx_volix_scheduled_task_enabled',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('volix_scheduled_task', 'idx_volix_scheduled_task_enabled');
    await queryInterface.removeIndex('volix_scheduled_task', 'idx_volix_scheduled_task_user');
    await queryInterface.dropTable('volix_scheduled_task');
  },
};
