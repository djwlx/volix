import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';
import type { ScheduledTaskEntity } from '../types/scheduled-task.types';

export type ScheduledTaskModelType = Model<ScheduledTaskEntity>;

export const ScheduledTaskModel = sequelize.define<ScheduledTaskModelType>('scheduled_task', {
  id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  task_type: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  cron_expr: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  timezone: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'Asia/Shanghai',
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'idle',
  },
  last_run_at: {
    type: DataTypes.DATE,
  },
  next_run_at: {
    type: DataTypes.DATE,
  },
  last_success_at: {
    type: DataTypes.DATE,
  },
  last_error: {
    type: DataTypes.TEXT,
  },
  script_language: {
    type: DataTypes.STRING(32),
  },
  script_content: {
    type: DataTypes.TEXT('long'),
  },
  script_entry_args: {
    type: DataTypes.TEXT,
  },
  builtin_handler: {
    type: DataTypes.STRING(128),
  },
  builtin_payload: {
    type: DataTypes.TEXT,
  },
  created_by: {
    type: DataTypes.STRING(64),
  },
  updated_by: {
    type: DataTypes.STRING(64),
  },
});
