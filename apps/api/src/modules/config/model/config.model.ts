import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export enum AppConfigEnum {
  cookie_115 = 'cookie_115',
  is_115_picture_caching = 'is_115_picture_caching',
  picture_115_cids = 'picture_115_cids',
  account_qbittorrent = 'account_qbittorrent',
  account_openlist = 'account_openlist',
  account_smtp = 'account_smtp',
  register_email_verify_enabled = 'register_email_verify_enabled',
}

export interface ConfigType {
  config_name: AppConfigEnum;
  config_content: string;
}

export type ConfigModelType = Model<ConfigType>;

export const ConfigModel = sequelize.define<ConfigModelType>('app_config', {
  config_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  config_content: {
    type: DataTypes.STRING,
  },
});
