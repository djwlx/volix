import { UserRole } from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type UserType = Model<{
  id?: string | number;
  email: string;
  nickname?: string;
  avatar?: string;
  password: string;
  role?: UserRole;
  role_key?: string;
}>;

export const UserModel = sequelize.define<UserType>('app_user', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
});
