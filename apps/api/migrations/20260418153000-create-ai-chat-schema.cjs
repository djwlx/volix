'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('app_ai_conversation', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
      last_message_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_ai_message', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      conversation_id: { type: Sequelize.STRING, allowNull: false },
      run_id: { type: Sequelize.STRING },
      tool_call_id: { type: Sequelize.STRING },
      role: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'completed' },
      meta_json: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_ai_run', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      conversation_id: { type: Sequelize.STRING, allowNull: false },
      trigger_message_id: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'queued' },
      model: { type: Sequelize.STRING },
      current_step: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      error_message: { type: Sequelize.TEXT },
      started_at: { type: Sequelize.DATE },
      finished_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_ai_tool_call', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      conversation_id: { type: Sequelize.STRING, allowNull: false },
      run_id: { type: Sequelize.STRING, allowNull: false },
      tool_name: { type: Sequelize.STRING, allowNull: false },
      risk_level: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'queued' },
      requires_approval: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      arguments_json: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      result_json: { type: Sequelize.TEXT },
      error_message: { type: Sequelize.TEXT },
      started_at: { type: Sequelize.DATE },
      finished_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_ai_event', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      conversation_id: { type: Sequelize.STRING, allowNull: false },
      run_id: { type: Sequelize.STRING },
      sequence: { type: Sequelize.INTEGER, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      payload_json: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('app_ai_event');
    await queryInterface.dropTable('app_ai_tool_call');
    await queryInterface.dropTable('app_ai_run');
    await queryInterface.dropTable('app_ai_message');
    await queryInterface.dropTable('app_ai_conversation');
  },
};
