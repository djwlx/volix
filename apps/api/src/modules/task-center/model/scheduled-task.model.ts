import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/sequelize';

export interface ScheduledTaskEntity {
  id: string;
  user_id: string;
  name: string;
  type: string;
  enabled: boolean;
  cron: string;
  params_json: string;
  last_run_at?: Date | null;
  last_run_status?: string | null;
  last_run_error?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type ScheduledTaskModelType = Model<ScheduledTaskEntity>;

export const ScheduledTaskModel = sequelize.define<ScheduledTaskModelType>('volix_scheduled_task', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  cron: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  params_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
  },
  last_run_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_run_status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_run_error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export const ensureScheduledTaskSchema = async () => {
  await ScheduledTaskModel.sync();
};
