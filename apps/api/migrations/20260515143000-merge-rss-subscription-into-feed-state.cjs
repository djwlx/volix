'use strict';

const DEFAULT_RSS_HUB = 'https://rsshub.app/';

const normalizeHost = host => {
  const text = String(host || '').trim();
  if (!text) {
    return DEFAULT_RSS_HUB;
  }
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return DEFAULT_RSS_HUB;
    }
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return DEFAULT_RSS_HUB;
  }
};

const normalizeRoute = route => {
  const text = String(route || '').trim();
  if (!text) {
    return '';
  }
  return text.startsWith('/') ? text : `/${text}`;
};

const buildFeedUrl = (host, route) => {
  const normalizedRoute = normalizeRoute(route);
  if (!normalizedRoute) {
    return '';
  }
  try {
    return new URL(normalizedRoute, normalizeHost(host)).toString();
  } catch {
    return new URL(normalizedRoute, DEFAULT_RSS_HUB).toString();
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user_rss_feed_subscribe', 'is_subscribed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addIndex('volix_user_rss_feed_subscribe', ['user_id', 'is_subscribed', 'updated_at'], {
      name: 'idx_volix_user_rss_feed_subscribe_user_subscribed_updated_at',
    });

    const [settings, subscriptions, states] = await Promise.all([
      queryInterface.sequelize.query('SELECT user_id, host FROM volix_user_rss_setting', {
        type: Sequelize.QueryTypes.SELECT,
      }),
      queryInterface.sequelize.query(
        'SELECT user_id, route, name, created_at, updated_at FROM volix_user_rss_subscription ORDER BY id ASC',
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      ),
      queryInterface.sequelize.query(
        'SELECT id, user_id, route, name, feed_url FROM volix_user_rss_feed_subscribe',
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      ),
    ]);

    const hostMap = new Map(
      settings.map(item => [String(item.user_id || '').trim(), normalizeHost(String(item.host || ''))])
    );
    const stateMap = new Map(
      states.map(item => [`${String(item.user_id || '').trim()}::${String(item.route || '').trim()}`, item])
    );

    for (const subscription of subscriptions) {
      const userId = String(subscription.user_id || '').trim();
      const route = normalizeRoute(subscription.route);
      if (!userId || !route) {
        continue;
      }

      const key = `${userId}::${route}`;
      const name = String(subscription.name || '').trim() || route;
      const feedUrl = buildFeedUrl(hostMap.get(userId) || DEFAULT_RSS_HUB, route);
      const createdAt = subscription.created_at || new Date();
      const updatedAt = subscription.updated_at || new Date();
      const state = stateMap.get(key);

      if (state) {
        await queryInterface.sequelize.query(
          'UPDATE volix_user_rss_feed_subscribe SET name = ?, feed_url = ?, is_subscribed = 1, updated_at = ? WHERE id = ?',
          {
            replacements: [name || String(state.name || route), String(state.feed_url || feedUrl), updatedAt, state.id],
          }
        );
        continue;
      }

      await queryInterface.sequelize.query(
        'INSERT INTO volix_user_rss_feed_subscribe (user_id, route, name, feed_url, title, description, link, last_fetched_at, last_processed_at, last_source_hash, is_subscribed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
        {
          replacements: [userId, route, name, feedUrl, '', '', '', '', '', '', createdAt, updatedAt],
        }
      );
    }

    await queryInterface.removeIndex('volix_user_rss_subscription', 'idx_volix_user_rss_subscription_user_updated_at');
    await queryInterface.removeIndex('volix_user_rss_subscription', 'idx_volix_user_rss_subscription_user_route_unique');
    await queryInterface.dropTable('volix_user_rss_subscription');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('volix_user_rss_subscription', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.STRING, allowNull: false },
      route: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('volix_user_rss_subscription', ['user_id', 'route'], {
      unique: true,
      name: 'idx_volix_user_rss_subscription_user_route_unique',
    });
    await queryInterface.addIndex('volix_user_rss_subscription', ['user_id', 'updated_at'], {
      name: 'idx_volix_user_rss_subscription_user_updated_at',
    });

    const states = await queryInterface.sequelize.query(
      'SELECT user_id, route, name, created_at, updated_at FROM volix_user_rss_feed_subscribe WHERE is_subscribed = 1 ORDER BY id ASC',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const state of states) {
      await queryInterface.sequelize.query(
        'INSERT INTO volix_user_rss_subscription (user_id, route, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        {
          replacements: [
            String(state.user_id || ''),
            String(state.route || ''),
            String(state.name || ''),
            state.created_at || new Date(),
            state.updated_at || new Date(),
          ],
        }
      );
    }

    await queryInterface.removeIndex(
      'volix_user_rss_feed_subscribe',
      'idx_volix_user_rss_feed_subscribe_user_subscribed_updated_at'
    );
    await queryInterface.removeColumn('volix_user_rss_feed_subscribe', 'is_subscribed');
  },
};

