import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';

export interface UserRssFeedItemEntity {
  id?: number;
  user_id: string;
  route: string;
  item_key: string;
  item_id?: string;
  title?: string;
  link?: string;
  description?: string;
  description_html?: string;
  description_html_file_key?: string;
  image_urls?: string;
  author?: string;
  published_at?: string;
  guid?: string;
  category?: string;
  updated_at_text?: string;
  enclosure_url?: string;
  enclosure_length?: number;
  enclosure_type?: string;
  comments_count?: number;
  upvotes_count?: number;
  downvotes_count?: number;
  media_json?: string;
  doi?: string;
  source_hash?: string;
  resource_count?: number;
  resources_localized?: boolean;
  resource_download_attempts?: number;
  is_read?: boolean;
  tags?: string;
  fetched_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRssFeedItemModelType = Model<UserRssFeedItemEntity>;

export const UserRssFeedItemModel = sequelize.define<UserRssFeedItemModelType>('volix_user_rss_feed_item', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  route: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  item_key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  item_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_html: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_html_file_key: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image_urls: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  published_at: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guid: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  updated_at_text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enclosure_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enclosure_length: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  enclosure_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  comments_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  upvotes_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  downvotes_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  media_json: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  doi: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  source_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resource_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  resources_localized: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  resource_download_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
  },
  fetched_at: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export const ensureRssFeedItemSchema = async () => {
  await UserRssFeedItemModel.sync();
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('volix_user_rss_feed_item');

  if (!columns.resources_localized) {
    await queryInterface.addColumn('volix_user_rss_feed_item', 'resources_localized', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  if (!columns.resource_download_attempts) {
    await queryInterface.addColumn('volix_user_rss_feed_item', 'resource_download_attempts', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
};
