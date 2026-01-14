import sequelize from '../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import { FileType as SFileType } from '../service';

export type FileType = Model<SFileType>;

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
  extension: {
    type: DataTypes.STRING,
  },
  storage: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'local',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'normal',
  },
  uuid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

export { FileModel };
