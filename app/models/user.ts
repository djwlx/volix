import sequelize from '../utils/sequelize';
import { DataTypes } from 'sequelize';

const user = sequelize.define('app_user', {
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
});

// user.sync({ alter: true });

export default user;
