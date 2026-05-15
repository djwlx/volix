'use strict';

const OLD_TABLE = 'volix_user_rss_feed_state';
const NEW_TABLE = 'volix_user_rss_feed_subscribe';

const OLD_ROUTE_INDEX = 'idx_volix_user_rss_feed_state_user_route_unique';
const NEW_ROUTE_INDEX = 'idx_volix_user_rss_feed_subscribe_user_route_unique';

const OLD_SUBSCRIBED_INDEX = 'idx_volix_user_rss_feed_state_user_subscribed_updated_at';
const NEW_SUBSCRIBED_INDEX = 'idx_volix_user_rss_feed_subscribe_user_subscribed_updated_at';

const normalizeTableName = table => {
  if (typeof table === 'string') {
    return table;
  }
  if (table && typeof table === 'object') {
    if (typeof table.tableName === 'string') {
      return table.tableName;
    }
    if (typeof table.table_name === 'string') {
      return table.table_name;
    }
  }
  return String(table || '');
};

const hasIndex = async (queryInterface, tableName, indexName) => {
  try {
    const indexes = await queryInterface.showIndex(tableName);
    return indexes.some(item => item && item.name === indexName);
  } catch {
    return false;
  }
};

const renameIndexByRecreate = async (queryInterface, tableName, oldName, newName, fields, unique = false) => {
  const newExists = await hasIndex(queryInterface, tableName, newName);
  if (newExists) {
    return;
  }
  const oldExists = await hasIndex(queryInterface, tableName, oldName);
  if (oldExists) {
    await queryInterface.removeIndex(tableName, oldName);
  }
  await queryInterface.addIndex(tableName, fields, { name: newName, unique });
};

module.exports = {
  async up(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map(normalizeTableName);
    const hasOld = tables.includes(OLD_TABLE);
    const hasNew = tables.includes(NEW_TABLE);

    if (hasOld && !hasNew) {
      await queryInterface.renameTable(OLD_TABLE, NEW_TABLE);
    }

    const tableName = hasNew || (hasOld && !hasNew) ? NEW_TABLE : null;
    if (!tableName) {
      return;
    }

    await renameIndexByRecreate(
      queryInterface,
      tableName,
      OLD_ROUTE_INDEX,
      NEW_ROUTE_INDEX,
      ['user_id', 'route'],
      true
    );

    const hasSubscribedColumn = await queryInterface
      .describeTable(tableName)
      .then(columns => Boolean(columns && columns.is_subscribed))
      .catch(() => false);

    if (hasSubscribedColumn) {
      await renameIndexByRecreate(
        queryInterface,
        tableName,
        OLD_SUBSCRIBED_INDEX,
        NEW_SUBSCRIBED_INDEX,
        ['user_id', 'is_subscribed', 'updated_at'],
        false
      );
    }
  },

  async down(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map(normalizeTableName);
    const hasOld = tables.includes(OLD_TABLE);
    const hasNew = tables.includes(NEW_TABLE);

    if (hasNew && !hasOld) {
      const hasSubscribedColumn = await queryInterface
        .describeTable(NEW_TABLE)
        .then(columns => Boolean(columns && columns.is_subscribed))
        .catch(() => false);

      const routeNewExists = await hasIndex(queryInterface, NEW_TABLE, NEW_ROUTE_INDEX);
      if (routeNewExists) {
        await queryInterface.removeIndex(NEW_TABLE, NEW_ROUTE_INDEX);
      }
      const routeOldExists = await hasIndex(queryInterface, NEW_TABLE, OLD_ROUTE_INDEX);
      if (!routeOldExists) {
        await queryInterface.addIndex(NEW_TABLE, ['user_id', 'route'], {
          name: OLD_ROUTE_INDEX,
          unique: true,
        });
      }

      if (hasSubscribedColumn) {
        const subscribedNewExists = await hasIndex(queryInterface, NEW_TABLE, NEW_SUBSCRIBED_INDEX);
        if (subscribedNewExists) {
          await queryInterface.removeIndex(NEW_TABLE, NEW_SUBSCRIBED_INDEX);
        }
        const subscribedOldExists = await hasIndex(queryInterface, NEW_TABLE, OLD_SUBSCRIBED_INDEX);
        if (!subscribedOldExists) {
          await queryInterface.addIndex(NEW_TABLE, ['user_id', 'is_subscribed', 'updated_at'], {
            name: OLD_SUBSCRIBED_INDEX,
          });
        }
      }

      await queryInterface.renameTable(NEW_TABLE, OLD_TABLE);
    }
  },
};

