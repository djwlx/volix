import { http } from '@/utils';
import type {
  CreateScheduledTaskPayload,
  ScheduledTaskDetailResponse,
  ScheduledTaskLogsResponse,
  ScheduledTaskResponse,
  ScheduledTaskRunResponse,
  TriggerScheduledTaskResponse,
  UpdateScheduledTaskPayload,
} from '@volix/types';

export const getScheduledTaskList = () => {
  return http.get<ScheduledTaskResponse[]>('/scheduled-tasks');
};

export const getScheduledTaskDetail = (id: string | number) => {
  return http.get<ScheduledTaskDetailResponse>(`/scheduled-tasks/${id}`);
};

export const createScheduledTaskByAdmin = (data: CreateScheduledTaskPayload) => {
  return http.post<ScheduledTaskResponse>('/scheduled-tasks', data);
};

export const updateScheduledTaskByAdmin = (id: string | number, data: UpdateScheduledTaskPayload) => {
  return http.put<ScheduledTaskResponse>(`/scheduled-tasks/${id}`, data);
};

export const getScheduledTaskRuns = (id: string | number) => {
  return http.get<ScheduledTaskRunResponse[]>(`/scheduled-tasks/${id}/runs`);
};

export const getScheduledTaskLogs = (id: string | number) => {
  return http.get<ScheduledTaskLogsResponse>(`/scheduled-tasks/${id}/logs`);
};

export const toggleScheduledTaskByAdmin = (id: string | number) => {
  return http.post<ScheduledTaskResponse>(`/scheduled-tasks/${id}/toggle`);
};

export const runScheduledTaskNow = (id: string | number) => {
  return http.post<TriggerScheduledTaskResponse>(`/scheduled-tasks/${id}/run-now`);
};
