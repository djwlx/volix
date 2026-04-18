import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import type { ScheduledTaskRunEntity } from '../types/scheduled-task.types';

export type ScheduledTaskRunModelType = Model<ScheduledTaskRunEntity>;

export const ScheduledTaskRunModel = sequelize.define<ScheduledTaskRunModelType>('scheduled_task_run', {
  id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    primaryKey: true,
  },
  task_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  trigger_type: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'queued',
  },
  started_at: {
    type: DataTypes.DATE,
  },
  finished_at: {
    type: DataTypes.DATE,
  },
  duration_ms: {
    type: DataTypes.INTEGER,
  },
  summary: {
    type: DataTypes.TEXT,
  },
  error_message: {
    type: DataTypes.TEXT,
  },
  log_path: {
    type: DataTypes.STRING(255),
  },
});
