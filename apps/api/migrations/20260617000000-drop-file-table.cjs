'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('volix_file');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('volix_file', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      mime_type: { type: Sequelize.STRING, allowNull: true },
      size: { type: Sequelize.FLOAT, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: true },
      extension: { type: Sequelize.STRING, allowNull: true },
      storage: { type: Sequelize.STRING, allowNull: false, defaultValue: 'local' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'normal' },
      uuid: { type: Sequelize.STRING, allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
};
