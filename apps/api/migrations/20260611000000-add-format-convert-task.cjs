'use strict';

const TABLE_NAME = 'volix_format_convert_task';

const COLUMNS = {
  id: { type: 'INTEGER', allowNull: false, autoIncrement: true, primaryKey: true },
  user_id: { type: 'STRING', allowNull: false },
  mode: { type: 'STRING', allowNull: false },
  command_mode: { type: 'STRING', allowNull: false, defaultValue: 'preset' },
  status: { type: 'STRING', allowNull: false, defaultValue: 'pending' },
  source_json: { type: 'TEXT', allowNull: false, defaultValue: '{}' },
  target_json: { type: 'TEXT', allowNull: false, defaultValue: '{}' },
  option_json: { type: 'TEXT', allowNull: false, defaultValue: '{}' },
  preset_id: { type: 'STRING', allowNull: true },
  attempt_count: { type: 'INTEGER', allowNull: false, defaultValue: 0 },
  last_stage: { type: 'STRING', allowNull: true },
  workspace_dir: { type: 'STRING', allowNull: true },
  source_local_path: { type: 'STRING', allowNull: true },
  output_local_path: { type: 'STRING', allowNull: true },
  log_local_path: { type: 'STRING', allowNull: true },
  result_local_path: { type: 'STRING', allowNull: true },
  result_openlist_path: { type: 'STRING', allowNull: true },
  error_message: { type: 'TEXT', allowNull: true },
  started_at: { type: 'DATE', allowNull: true },
  finished_at: { type: 'DATE', allowNull: true },
  created_at: { type: 'DATE', allowNull: false },
  updated_at: { type: 'DATE', allowNull: false },
};

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS "idx_volix_format_convert_task_user_created_at" ON "volix_format_convert_task" ("user_id", "created_at")',
  'CREATE INDEX IF NOT EXISTS "idx_volix_format_convert_task_status_created_at" ON "volix_format_convert_task" ("status", "created_at")',
  'CREATE INDEX IF NOT EXISTS "idx_volix_format_convert_task_mode_status_created_at" ON "volix_format_convert_task" ("mode", "status", "created_at")',
  'CREATE INDEX IF NOT EXISTS "idx_volix_format_convert_task_last_stage" ON "volix_format_convert_task" ("last_stage")',
  'CREATE INDEX IF NOT EXISTS "idx_volix_format_convert_task_result_openlist_path" ON "volix_format_convert_task" ("result_openlist_path")',
];

const DROP_INDEXES = [
  'DROP INDEX IF EXISTS "idx_volix_format_convert_task_result_openlist_path"',
  'DROP INDEX IF EXISTS "idx_volix_format_convert_task_last_stage"',
  'DROP INDEX IF EXISTS "idx_volix_format_convert_task_mode_status_created_at"',
  'DROP INDEX IF EXISTS "idx_volix_format_convert_task_status_created_at"',
  'DROP INDEX IF EXISTS "idx_volix_format_convert_task_user_created_at"',
];

const mapColumnDefinition = (Sequelize, column) => ({
  ...column,
  type: Sequelize[column.type],
});

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);

    if (!table) {
      const columns = Object.fromEntries(
        Object.entries(COLUMNS).map(([name, column]) => [name, mapColumnDefinition(Sequelize, column)])
      );
      await queryInterface.createTable(TABLE_NAME, columns);
    } else {
      for (const [name, column] of Object.entries(COLUMNS)) {
        if (table[name]) {
          continue;
        }
        await queryInterface.addColumn(TABLE_NAME, name, mapColumnDefinition(Sequelize, column));
      }
    }

    for (const sql of INDEXES) {
      await queryInterface.sequelize.query(sql);
    }
  },

  async down(queryInterface) {
    for (const sql of DROP_INDEXES) {
      await queryInterface.sequelize.query(sql);
    }

    const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);
    if (table) {
      await queryInterface.dropTable(TABLE_NAME);
    }
  },
};
