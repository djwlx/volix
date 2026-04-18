import type {
  ScheduledTaskCategory,
  ScheduledTaskRunStatus,
  ScheduledTaskRunTriggerType,
  ScheduledTaskStatus,
  ScheduledTaskType,
} from '@volix/types';

export interface ScheduledTaskEntity {
  id: string;
  name: string;
  description?: string | null;
  category: ScheduledTaskCategory;
  task_type: ScheduledTaskType;
  enabled: boolean;
  cron_expr: string;
  timezone: string;
  status: ScheduledTaskStatus;
  last_run_at?: Date | null;
  next_run_at?: Date | null;
  last_success_at?: Date | null;
  last_error?: string | null;
  script_language?: 'javascript' | null;
  script_content?: string | null;
  script_entry_args?: string | null;
  builtin_handler?: string | null;
  builtin_payload?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ScheduledTaskRunEntity {
  id: string;
  task_id: string;
  trigger_type: ScheduledTaskRunTriggerType;
  status: ScheduledTaskRunStatus;
  started_at?: Date | null;
  finished_at?: Date | null;
  duration_ms?: number | null;
  summary?: string | null;
  error_message?: string | null;
  log_path?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
