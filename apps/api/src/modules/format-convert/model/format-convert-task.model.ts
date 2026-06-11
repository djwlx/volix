import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';
import type { FormatConvertTaskEntity } from '../types/format-convert.types';

export type FormatConvertTaskModelType = Model<FormatConvertTaskEntity>;

export const FormatConvertTaskModel = sequelize.define<FormatConvertTaskModelType>('volix_format_convert_task', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  command_mode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'preset',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  source_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  target_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  option_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  preset_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attempt_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  last_stage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workspace_dir: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  source_local_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  output_local_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  log_local_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  result_local_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  result_openlist_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  finished_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});
