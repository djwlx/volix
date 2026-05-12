import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type File115Type = Model<{
  pc: string;
  class: string;
  cid: string | null;
  parentCid: string | null;
  fullPath: string | null;
  isLiked: boolean | null;
  localCacheFileName: string | null;
}>;

export const File115Model = sequelize.define<File115Type>('volix_115_file', {
  pc: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  fullPath: {
    type: DataTypes.STRING,
    field: 'full_path',
  },
  isLiked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_liked',
  },
  localCacheFileName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'local_cache_file_name',
  },
});
