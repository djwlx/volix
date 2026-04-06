'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('app_config', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      config_name: { type: Sequelize.STRING, allowNull: false, unique: true },
      config_content: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_file', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      mime_type: { type: Sequelize.STRING },
      size: { type: Sequelize.FLOAT },
      path: { type: Sequelize.STRING },
      extension: { type: Sequelize.STRING },
      storage: { type: Sequelize.STRING, allowNull: false, defaultValue: 'local' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'normal' },
      uuid: { type: Sequelize.STRING, allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_role', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      role_key: { type: Sequelize.STRING, allowNull: false, unique: true },
      role_name: { type: Sequelize.STRING, allowNull: false },
      features: { type: Sequelize.TEXT, allowNull: false, defaultValue: '[]' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('app_user', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      nickname: { type: Sequelize.STRING },
      avatar: { type: Sequelize.STRING },
      password: { type: Sequelize.STRING },
      role: { type: Sequelize.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
      role_key: { type: Sequelize.STRING, allowNull: false, defaultValue: 'default' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('115_file', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      pc: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      class: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('115_file');
    await queryInterface.dropTable('app_user');
    await queryInterface.dropTable('app_role');
    await queryInterface.dropTable('app_file');
    await queryInterface.dropTable('app_config');
  },
};
