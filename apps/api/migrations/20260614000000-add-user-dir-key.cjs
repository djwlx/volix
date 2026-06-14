'use strict';

const crypto = require('crypto');

const buildDirKey = id =>
  crypto.createHash('sha256').update(String(id || '').trim()).digest('hex').slice(0, 24);

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user', 'dir_key', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    const rows = await queryInterface.sequelize.query('SELECT id FROM volix_user', {
      type: Sequelize.QueryTypes.SELECT,
    });

    for (const row of rows) {
      const id = row.id;
      if (id === undefined || id === null) {
        continue;
      }
      await queryInterface.sequelize.query('UPDATE volix_user SET dir_key = :dirKey WHERE id = :id', {
        replacements: {
          id,
          dirKey: buildDirKey(id),
        },
      });
    }

    await queryInterface.changeColumn('volix_user', 'dir_key', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addIndex('volix_user', ['dir_key'], {
      unique: true,
      name: 'idx_volix_user_dir_key_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('volix_user', 'idx_volix_user_dir_key_unique');
    await queryInterface.removeColumn('volix_user', 'dir_key');
  },
};
