import sequelize from '../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

type FileType = Model<{
  name: string;
  mime_type: string;
  size: number;
  path: string;
}>;

const FileModel = sequelize.define<FileType>('app_file', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING,
  },
  size: {
    type: DataTypes.FLOAT,
  },
  path: {
    type: DataTypes.STRING,
  },
});

export { FileModel };
