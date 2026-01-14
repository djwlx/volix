import sequelize from '../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

type File115Type = Model<{
  pc: string;
  name: string;
  class: string;
}>;

const File115Model = sequelize.define<File115Type>('115_file', {
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

export { File115Model };
