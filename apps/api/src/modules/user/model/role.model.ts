import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type RoleType = Model<{
  id?: string | number;
  role_key: string;
  role_name: string;
  features?: string;
}>;

export const RoleModel = sequelize.define<RoleType>('app_role', {
  role_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  features: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
  },
});
