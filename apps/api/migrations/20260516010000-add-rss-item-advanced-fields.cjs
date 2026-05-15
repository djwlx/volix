'use strict';

const TABLE_NAME = 'volix_user_rss_feed_item';

const COLUMNS = [
  { name: 'guid', type: 'STRING' },
  { name: 'category', type: 'TEXT' },
  { name: 'updated_at_text', type: 'STRING' },
  { name: 'enclosure_url', type: 'STRING' },
  { name: 'enclosure_length', type: 'INTEGER' },
  { name: 'enclosure_type', type: 'STRING' },
  { name: 'comments_count', type: 'INTEGER' },
  { name: 'upvotes_count', type: 'INTEGER' },
  { name: 'downvotes_count', type: 'INTEGER' },
  { name: 'media_json', type: 'TEXT' },
  { name: 'doi', type: 'STRING' },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);
    if (!table) {
      return;
    }

    for (const column of COLUMNS) {
      if (table[column.name]) {
        continue;
      }
      await queryInterface.addColumn(TABLE_NAME, column.name, {
        type: Sequelize[column.type],
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);
    if (!table) {
      return;
    }

    for (const column of COLUMNS.slice().reverse()) {
      if (!table[column.name]) {
        continue;
      }
      await queryInterface.removeColumn(TABLE_NAME, column.name);
    }
  },
};
