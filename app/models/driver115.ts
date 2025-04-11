import sequelize from '../utils/sequelize';
import { DataTypes } from 'sequelize';

const file115Model = sequelize.define('115_file', {
  pc: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  class: {
    type: DataTypes.STRING,
  },
});
// file115Model.sync({ alter: true });

export default file115Model;
