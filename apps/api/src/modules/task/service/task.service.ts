import { TaskModel } from '../model/task.model';
import type { TaskPayload } from '../types/task.types';

export const queryTask = async (param: Partial<TaskPayload>) => {
  return TaskModel.findOne({ where: param });
};

export const addTask = async (param: TaskPayload) => {
  return TaskModel.create(param);
};
