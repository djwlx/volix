import { AnimeSubscriptionStatus } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import type { AnimeSubscriptionEntity } from '../types/anime-subscription.types';

export type AnimeSubscriptionType = Model<AnimeSubscriptionEntity>;

export const AnimeSubscriptionModel = sequelize.define<AnimeSubscriptionType>('anime_subscription', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  aliases: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
  },
  rss_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  series_root_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qbit_save_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  openlist_download_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  enable_email_notification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  current_stage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  use_ai: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  match_keywords: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
  },
  rename_pattern: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '{{series}}/S{{season}}/E{{episode}}',
  },
  check_interval_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
  },
  last_checked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_success_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(AnimeSubscriptionStatus)),
    allowNull: false,
    defaultValue: AnimeSubscriptionStatus.ACTIVE,
  },
});
