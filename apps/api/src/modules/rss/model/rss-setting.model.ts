import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';

export interface UserRssSettingEntity {
  id?: number;
  user_id: string;
  host: string;
  resource_proxy_base_url?: string;
  resource_cache_max_size_mb?: number;
  created_at?: string;
  updated_at?: string;
}

export type UserRssSettingModelType = Model<UserRssSettingEntity>;

export const UserRssSettingModel = sequelize.define<UserRssSettingModelType>('volix_user_rss_setting', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'https://rsshub.app',
  },
  resource_proxy_base_url: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  resource_cache_max_size_mb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 512,
  },
});
