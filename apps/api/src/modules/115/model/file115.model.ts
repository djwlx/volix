import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type File115Type = Model<{
  pc: string;
  name: string;
  class: string;
  cid: string | null;
  parentCid: string | null;
}>;

export const File115Model = sequelize.define<File115Type>('115_file', {
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
  cid: {
    type: DataTypes.STRING,
  },
  parentCid: {
    type: DataTypes.STRING,
    field: 'parent_cid',
  },
});
