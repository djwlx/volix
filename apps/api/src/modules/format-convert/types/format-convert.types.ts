import type {
  CreateFormatConvertTaskRequest,
  CreateFormatConvertTaskResult,
  FormatConvertCommandMode,
  FormatConvertEngine,
  FormatConvertImageInfo,
  FormatConvertImageOption,
  FormatConvertImageSummary,
  FormatConvertMediaInfo,
  FormatConvertMode,
  FormatConvertOption,
  FormatConvertPreset,
  FormatConvertSummary,
  FormatConvertSource,
  FormatConvertTarget,
  FormatConvertTaskItem as SharedFormatConvertTaskItem,
  FormatConvertTaskStage,
  FormatConvertTaskStatus,
  GetFormatConvertPresetsResult,
  GetFormatConvertTaskListResult,
} from '@volix/types';

export type {
  CreateFormatConvertTaskRequest,
  CreateFormatConvertTaskResult,
  FormatConvertImageInfo,
  FormatConvertImageOption,
  FormatConvertImageSummary,
  FormatConvertMediaInfo,
  FormatConvertOption,
  FormatConvertPreset,
  FormatConvertSummary,
  FormatConvertSource,
  FormatConvertTarget,
  GetFormatConvertPresetsResult,
  GetFormatConvertTaskListResult,
};

export interface FormatConvertTaskItem extends SharedFormatConvertTaskItem {
  requestUserAgent?: string;
}

export interface FormatConvertTaskEntity {
  id?: number;
  user_id: string;
  mode: FormatConvertMode;
  engine?: FormatConvertEngine;
  command_mode: FormatConvertCommandMode;
  status: FormatConvertTaskStatus;
  source_json: string;
  target_json: string;
  option_json: string;
  source_media_info_json?: string;
  convert_summary_json?: string;
  result_media_info_json?: string;
  preset_id?: string;
  attempt_count?: number;
  request_user_agent?: string;
  last_stage?: FormatConvertTaskStage;
  workspace_dir?: string;
  source_local_path?: string;
  output_local_path?: string;
  log_local_path?: string;
  result_local_path?: string;
  result_openlist_path?: string;
  error_message?: string;
  started_at?: Date | string;
  finished_at?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface FormatConvertTaskSnapshot {
  source: FormatConvertSource;
  target: FormatConvertTarget;
  option: FormatConvertOption;
  sourceMediaInfo?: FormatConvertMediaInfo;
  convertSummary?: FormatConvertSummary;
  resultMediaInfo?: FormatConvertMediaInfo;
}

export interface CreateFormatConvertTaskDbPayload extends Omit<CreateFormatConvertTaskRequest, 'option'> {
  userId: string;
  engine?: FormatConvertEngine;
  option: FormatConvertOption | FormatConvertImageOption;
  status?: FormatConvertTaskStatus;
  attemptCount?: number;
  requestUserAgent?: string;
  sourceMediaInfo?: FormatConvertMediaInfo | FormatConvertImageInfo;
  convertSummary?: FormatConvertSummary | FormatConvertImageSummary;
  resultMediaInfo?: FormatConvertMediaInfo | FormatConvertImageInfo;
}
