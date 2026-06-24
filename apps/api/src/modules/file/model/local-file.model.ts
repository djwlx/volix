import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';

export interface LocalFileEntity {
  id: string;
  user_id: string;
  dir_key?: string | null;
  module: string;
  relative_path: string;
  original_name: string;
  extension?: string | null;
  mime_type?: string | null;
  size?: number | null;
  visibility: string;
  checksum?: string | null;
  metadata_json: string;
  status: string;
  expires_at?: Date | null;
}

export type LocalFileModelType = Model<LocalFileEntity>;

export const LocalFileModel = sequelize.define<LocalFileModelType>('volix_local_file', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dir_key: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'upload',
  },
  relative_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  extension: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  visibility: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'public',
  },
  checksum: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export const ensureLocalFileSchema = async () => {
  await LocalFileModel.sync();
};
