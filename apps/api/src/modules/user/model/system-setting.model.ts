import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type SystemSettingType = Model<{
  id?: string | number;
  setting_key: string;
  setting_value?: string;
}>;

export const SystemSettingModel = sequelize.define<SystemSettingType>('volix_system_setting', {
  setting_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});
