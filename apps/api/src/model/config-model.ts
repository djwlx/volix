import { ConfigKeyType } from '../service/config';
import sequelize from '../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

type ConfigType = Model<{
  config_name: ConfigKeyType;
  config_content: string;
}>;

const ConfigModel = sequelize.define<ConfigType>('app_config', {
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
