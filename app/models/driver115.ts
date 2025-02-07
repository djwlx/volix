import sequelize from '../utils/sequelize';
import { DataTypes } from 'sequelize';

const file115Model = sequelize.define('115_file', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  json: {
    type: DataTypes.JSON,
  },
  class: {
    type: DataTypes.STRING,
  },
  pc: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});
// file115Model.sync({ alter: true });

export default file115Model;
