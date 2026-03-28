import type { TaskStatusEnum, TaskTypeEnum } from '../model/task.model';

export interface TaskPayload {
  task_name: string;
  task_type: TaskTypeEnum;
  cron: string;
  payload: JSON;
  status?: TaskStatusEnum;
  description?: string;
}
