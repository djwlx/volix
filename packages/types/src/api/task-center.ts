export enum ScheduledTaskType {
  ASTRBOT_RANDOM_PIC = 'astrbot_random_pic',
}

export type ScheduledTaskRunStatus = 'success' | 'failed';

export interface AstrbotRandomPicTaskParams {
  umos: string[];
}

export type ScheduledTaskParams = AstrbotRandomPicTaskParams | Record<string, unknown>;

export type ScheduledTaskTypeDefaults = Partial<{
  [ScheduledTaskType.ASTRBOT_RANDOM_PIC]: AstrbotRandomPicTaskParams;
}>;

export interface ScheduledTask {
  id: string;
  name: string;
  type: ScheduledTaskType;
  enabled: boolean;
  cron: string;
  params: ScheduledTaskParams;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastRunStatus?: ScheduledTaskRunStatus | null;
  lastRunError?: string | null;
  createdAt?: string;
}

export interface ScheduledTaskDefaults {
  taskTypeDefaults: ScheduledTaskTypeDefaults;
}

export interface ListScheduledTasksResponse {
  tasks: ScheduledTask[];
  defaults: ScheduledTaskDefaults;
}

export interface CreateScheduledTaskPayload {
  name: string;
  type: ScheduledTaskType;
  enabled: boolean;
  cron: string;
  params: ScheduledTaskParams;
}

export interface UpdateScheduledTaskPayload {
  id: string;
  name: string;
  enabled: boolean;
  cron: string;
  params: ScheduledTaskParams;
}

export interface DeleteScheduledTaskPayload {
  id: string;
}

export interface TriggerScheduledTaskPayload {
  id: string;
}

export interface TriggerScheduledTaskResponse {
  id: string;
  accepted: boolean;
}
