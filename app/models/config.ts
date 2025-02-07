import sequelize from '../utils/sequelize';
import { DataTypes } from 'sequelize';

const config = sequelize.define('app_config', {
  configName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  configContent: {
    type: DataTypes.JSON,
  },
});
// config.sync({ alter: true });

export default config;
