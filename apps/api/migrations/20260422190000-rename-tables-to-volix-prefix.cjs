'use strict';

const TABLE_RENAMES = [
  ['app_config', 'volix_config'],
  ['app_file', 'volix_file'],
  ['app_role', 'volix_role'],
  ['app_user', 'volix_user'],
  ['115_file', 'volix_115_file'],
  ['anime_subscription', 'volix_anime_subscription'],
  ['anime_subscription_item', 'volix_anime_subscription_item'],
  ['app_ai_conversation', 'volix_ai_conversation'],
  ['app_ai_message', 'volix_ai_message'],
  ['app_ai_run', 'volix_ai_run'],
  ['app_ai_tool_call', 'volix_ai_tool_call'],
  ['app_ai_event', 'volix_ai_event'],
  ['scheduled_task', 'volix_scheduled_task'],
];

module.exports = {
  async up(queryInterface) {
    for (const [from, to] of TABLE_RENAMES) {
      await queryInterface.renameTable(from, to);
    }
  },

  async down(queryInterface) {
    for (const [from, to] of TABLE_RENAMES.slice().reverse()) {
      await queryInterface.renameTable(to, from);
    }
  },
};
