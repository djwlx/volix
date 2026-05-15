import { UserRole } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type UserType = Model<{
  id?: string | number;
  email: string;
  email_verified?: boolean;
  nickname?: string;
  avatar?: string;
  password: string;
  role?: UserRole;
  role_key?: string;
  account_list?: string;
  rss_config?: string;
  settings_json?: string;
}>;

export const UserModel = sequelize.define<UserType>('volix_user', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  nickname: {
    type: DataTypes.STRING,
  },
  avatar: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.USER,
  },
  role_key: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default',
  },
  account_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  rss_config: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  settings_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
});
