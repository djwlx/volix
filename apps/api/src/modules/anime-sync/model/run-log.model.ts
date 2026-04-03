import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export type AnimeSyncRunLogModelType = Model<{
  id?: number;
  job_id: number;
  step: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  detail_json?: string;
}>;

export const AnimeSyncRunLogModel = sequelize.define<AnimeSyncRunLogModelType>('app_anime_run_log', {
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  step: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'info',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  detail_json: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});
