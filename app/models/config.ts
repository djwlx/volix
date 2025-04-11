import sequelize from '../utils/sequelize';
import { DataTypes } from 'sequelize';

const config = sequelize.define('app_config', {
  config_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  config_content: {
    type: DataTypes.STRING,
  },
});
// config.sync({ alter: true });

export default config;
