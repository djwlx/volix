import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type UserType = Model<{
  id?: string | number;
  email: string;
  nickname?: string;
  password: string;
  role?: 'user' | 'admin';
}>;

export const UserModel = sequelize.define<UserType>('app_user', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'username',
  },
  nickname: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
  },
});
