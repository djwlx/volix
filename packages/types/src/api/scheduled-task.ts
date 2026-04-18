export type ScheduledTaskCategory = 'anime' | 'script' | 'system' | 'custom';
export type ScheduledTaskType = 'builtin' | 'script';
export type ScheduledTaskStatus = 'idle' | 'running' | 'paused' | 'error';
export type ScheduledTaskRunTriggerType = 'schedule' | 'manual' | 'ai';
export type ScheduledTaskRunStatus = 'queued' | 'running' | 'success' | 'failed' | 'timeout';

export interface ScheduledTaskResponse {
  id: string;
  name: string;
  description?: string | null;
  category: ScheduledTaskCategory;
  taskType: ScheduledTaskType;
  enabled: boolean;
  cronExpr: string;
  timezone: string;
  status: ScheduledTaskStatus;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  scriptLanguage?: string | null;
  scriptContent?: string | null;
  scriptEntryArgs?: Record<string, unknown> | null;
  builtinHandler?: string | null;
  builtinPayload?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduledTaskRunResponse {
  id: string;
  taskId: string;
  triggerType: ScheduledTaskRunTriggerType;
  status: ScheduledTaskRunStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  summary?: string | null;
  errorMessage?: string | null;
  logPath?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduledTaskDetailResponse extends ScheduledTaskResponse {
  runs?: ScheduledTaskRunResponse[];
  logs?: string[];
}

export interface CreateScheduledTaskPayload {
  name: string;
  description?: string;
  category?: ScheduledTaskCategory;
  taskType?: ScheduledTaskType;
  enabled?: boolean;
  cronExpr: string;
  timezone?: string;
  scriptLanguage?: 'javascript' | null;
  scriptContent?: string | null;
  scriptEntryArgs?: Record<string, unknown> | null;
  builtinHandler?: string | null;
  builtinPayload?: Record<string, unknown> | null;
}

export interface UpdateScheduledTaskPayload extends Partial<CreateScheduledTaskPayload> {}

export interface ScheduledTaskLogsResponse {
  logs: string[];
}

export interface TriggerScheduledTaskResponse {
  message: string;
  taskId: string;
}
