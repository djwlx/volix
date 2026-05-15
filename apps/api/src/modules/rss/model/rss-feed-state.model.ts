import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';

export interface UserRssFeedStateEntity {
  id?: number;
  user_id: string;
  route: string;
  name?: string;
  feed_url: string;
  title?: string;
  description?: string;
  link?: string;
  last_fetched_at?: string;
  last_processed_at?: string;
  last_source_hash?: string;
  is_subscribed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type UserRssFeedStateModelType = Model<UserRssFeedStateEntity>;

export const UserRssFeedStateModel = sequelize.define<UserRssFeedStateModelType>('volix_user_rss_feed_subscribe', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  route: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  feed_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_fetched_at: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_processed_at: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_source_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_subscribed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});
