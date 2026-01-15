import sequelize from '../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export enum AppConfigEnum {
  // 115 cookie
  cookie_115 = 'cookie_115',
  // 115 是否在缓存图片
  is_115_picture_caching = 'is_115_picture_caching',
  // 115 缓存图片的目录
  picture_115_cids = 'picture_115_cids',
}

export interface ConfigType {
  config_name: AppConfigEnum;
  config_content: string;
}

export type ConfigModelType = Model<ConfigType>;

const ConfigModel = sequelize.define<ConfigModelType>('app_config', {
  config_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  config_content: {
    type: DataTypes.STRING,
  },
});

export { ConfigModel };
