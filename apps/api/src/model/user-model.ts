import sequelize from '../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

type UserType = Model<{
  username: string;
  nickname: string;
  password: string;
  role: 'user' | 'admin';
}>;

const UserModel = sequelize.define<UserType>('app_user', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
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

export { UserModel };
