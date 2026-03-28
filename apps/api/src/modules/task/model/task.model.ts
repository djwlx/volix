import { Spec } from 'node-schedule';
import sequelize from '../../../utils/sequelize';
import { DataTypes, Model } from 'sequelize';

export enum TaskTypeEnum {
  autoStopQbit = 'autoStopQbit',
  autoStartQbit = 'autoStartQbit',
}

export enum TaskStatusEnum {
  enable = 'active',
  disable = 'disable',
}

export type TaskType = Model<{
  task_name: string;
  task_type: TaskTypeEnum;
  cron: Spec;
  payload: JSON;
  status?: TaskStatusEnum;
  description?: string;
}>;

export const TaskModel = sequelize.define<TaskType>('app_task', {
  task_name: {
    type: DataTypes.STRING,
  },
  task_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cron: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSON,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'disable',
  },
  description: {
    type: DataTypes.STRING,
  },
});
