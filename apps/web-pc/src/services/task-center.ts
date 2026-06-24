import { http } from '@/utils';
import type {
  CreateScheduledTaskPayload,
  ListScheduledTasksResponse,
  ScheduledTask,
  TriggerScheduledTaskResponse,
  UpdateScheduledTaskPayload,
} from '@volix/types';

export const listScheduledTasks = () => {
  return http.get<ListScheduledTasksResponse>('/task-center/tasks');
};

export const createScheduledTask = (data: CreateScheduledTaskPayload) => {
  return http.post<ScheduledTask>('/task-center/tasks', data);
};

export const updateScheduledTask = (data: UpdateScheduledTaskPayload) => {
  return http.put<ScheduledTask>('/task-center/tasks', data);
};

export const deleteScheduledTask = (id: string) => {
  return http.delete<{ id: string }>(`/task-center/tasks/${id}`);
};

export const triggerScheduledTask = (id: string) => {
  return http.post<TriggerScheduledTaskResponse>(`/task-center/tasks/${id}/trigger`);
};
