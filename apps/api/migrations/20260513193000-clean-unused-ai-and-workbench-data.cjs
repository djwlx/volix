'use strict';

const LEGACY_UNUSED_TABLES = [
  'app_ai_conversation',
  'app_ai_message',
  'app_ai_run',
  'app_ai_tool_call',
  'app_ai_event',
  'anime_subscription_item',
  'anime_subscription',
  'scheduled_task_run',
  'scheduled_task',
];

const VOLIX_UNUSED_TABLES = [
  'volix_ai_conversation',
  'volix_ai_message',
  'volix_ai_run',
  'volix_ai_tool_call',
  'volix_ai_event',
  'volix_anime_subscription_item',
  'volix_anime_subscription',
  'volix_scheduled_task_run',
  'volix_scheduled_task',
];

const UNUSED_CONFIG_KEYS = ['picture_115_cids'];

const dropTableIfExists = async (queryInterface, tableName) => {
  try {
    await queryInterface.dropTable(tableName);
  } catch {
    // ignore table not found
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const tableName of [...VOLIX_UNUSED_TABLES, ...LEGACY_UNUSED_TABLES]) {
      await dropTableIfExists(queryInterface, tableName);
    }

    await queryInterface.bulkDelete(
      'volix_config',
      {
        config_name: {
          [Sequelize.Op.in]: UNUSED_CONFIG_KEYS,
        },
      },
      {}
    );
  },

  async down() {
    // no-op: destructive cleanup
  },
};

