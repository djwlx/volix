'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('volix_local_file', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      dir_key: { type: Sequelize.STRING, allowNull: true },
      module: { type: Sequelize.STRING, allowNull: false, defaultValue: 'upload' },
      relative_path: { type: Sequelize.STRING, allowNull: false },
      original_name: { type: Sequelize.STRING, allowNull: false },
      extension: { type: Sequelize.STRING, allowNull: true },
      mime_type: { type: Sequelize.STRING, allowNull: true },
      size: { type: Sequelize.INTEGER, allowNull: true },
      visibility: { type: Sequelize.STRING, allowNull: false, defaultValue: 'public' },
      checksum: { type: Sequelize.STRING, allowNull: true },
      metadata_json: { type: Sequelize.TEXT, allowNull: false, defaultValue: '{}' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('volix_local_file', ['user_id', 'relative_path'], {
      name: 'idx_volix_local_file_user_relative_path',
    });
    await queryInterface.addIndex('volix_local_file', ['user_id', 'module', 'status'], {
      name: 'idx_volix_local_file_user_module_status',
    });
    await queryInterface.addIndex('volix_local_file', ['relative_path'], {
      name: 'idx_volix_local_file_relative_path',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('volix_local_file', 'idx_volix_local_file_relative_path');
    await queryInterface.removeIndex('volix_local_file', 'idx_volix_local_file_user_module_status');
    await queryInterface.removeIndex('volix_local_file', 'idx_volix_local_file_user_relative_path');
    await queryInterface.dropTable('volix_local_file');
  },
};
