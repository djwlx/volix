import { AnimeSubscriptionItemStatus } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import type { AnimeSubscriptionItemEntity } from '../types/anime-subscription.types';

export type AnimeSubscriptionItemType = Model<AnimeSubscriptionItemEntity>;

export const AnimeSubscriptionItemModel = sequelize.define<AnimeSubscriptionItemType>('anime_subscription_item', {
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notify_email: {
    type: DataTypes.STRING,
  },
  rss_guid: {
    type: DataTypes.STRING,
  },
  rss_title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  detail_url: {
    type: DataTypes.STRING,
  },
  torrent_url: {
    type: DataTypes.STRING,
  },
  published_at: {
    type: DataTypes.DATE,
  },
  season: {
    type: DataTypes.INTEGER,
  },
  episode: {
    type: DataTypes.INTEGER,
  },
  episode_raw: {
    type: DataTypes.STRING,
  },
  resolution: {
    type: DataTypes.STRING,
  },
  subtitle_language: {
    type: DataTypes.STRING,
  },
  release_group: {
    type: DataTypes.STRING,
  },
  score: {
    type: DataTypes.FLOAT,
  },
  decision_status: {
    type: DataTypes.ENUM(...Object.values(AnimeSubscriptionItemStatus)),
    allowNull: false,
    defaultValue: AnimeSubscriptionItemStatus.PENDING,
  },
  qbit_hash: {
    type: DataTypes.STRING,
  },
  target_path: {
    type: DataTypes.STRING,
  },
  reason: {
    type: DataTypes.TEXT,
  },
});
