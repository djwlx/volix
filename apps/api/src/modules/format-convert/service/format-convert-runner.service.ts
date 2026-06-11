import path from 'path';
import {
  FormatConvertSourceType,
  FormatConvertTargetType,
  FormatConvertTaskStage,
  FormatConvertTaskStatus,
} from '@volix/types';
import { buildFormatConvertArgs, runFfmpegCommand } from './format-convert-ffmpeg.service';
import {
  downloadFormatConvertOpenlistSource,
  uploadFormatConvertResultToOpenlist,
} from './format-convert-openlist.service';
import { normalizeFormatConvertTaskOption } from './format-convert-option.service';
import { updateFormatConvertTaskStatus } from './format-convert-task-db.service';
import {
  ensureFormatConvertWorkspace,
  getFormatConvertLogPath,
  getFormatConvertWorkspaceDir,
  getFormatConvertWorkspaceFilePath,
  persistFormatConvertResult,
} from './format-convert-workspace.service';
import type { FormatConvertTaskItem } from '../types/format-convert.types';
import { log } from '../../../utils/logger';

export interface FormatConvertRunnerHooks {
  onStatusChange?: (status: FormatConvertTaskStatus) => void;
}

const buildOutputFilename = (task: FormatConvertTaskItem, outputFormat: string) => {
  const preferredName =
    (task.target.type === FormatConvertTargetType.DOWNLOAD ? task.target.fileName : task.target.fileName) ||
    task.source.fileName ||
    `task-${task.id}.${outputFormat}`;
  const baseName = preferredName.replace(/\.[^.]+$/, '');
  return `${baseName}.${outputFormat}`;
};

const resolveLocalSourcePath = (task: FormatConvertTaskItem) => {
  if (task.source.type !== FormatConvertSourceType.UPLOAD || !task.source.uploadPath) {
    throw new Error('format-convert-local-source-missing-upload-path');
  }
  return task.source.uploadPath;
};

const resolveStatusByStage = (stage: 'download' | 'convert' | 'upload') => {
  if (stage === 'download') {
    return FormatConvertTaskStatus.DOWNLOAD_FAILED;
  }
  if (stage === 'upload') {
    return FormatConvertTaskStatus.UPLOAD_FAILED;
  }
  return FormatConvertTaskStatus.CONVERT_FAILED;
};

export const runFormatConvertTask = async (task: FormatConvertTaskItem, hooks?: FormatConvertRunnerHooks) => {
  const normalizedOption = normalizeFormatConvertTaskOption(task);
  const outputFilename = buildOutputFilename(task, normalizedOption.outputFormat);
  const sourceWorkspaceName = `source${path.extname(task.source.fileName || '') || '.bin'}`;
  const outputWorkspaceName = `output.${normalizedOption.outputFormat}`;
  const logWorkspacePath = getFormatConvertLogPath(task.id);
  let currentStage: 'download' | 'convert' | 'upload' = 'convert';

  await ensureFormatConvertWorkspace(task.id);
  const sourceWorkspacePath = getFormatConvertWorkspaceFilePath(task.id, sourceWorkspaceName);
  const outputWorkspacePath = getFormatConvertWorkspaceFilePath(task.id, outputWorkspaceName);

  try {
    let inputPath = '';

    if (task.source.type === FormatConvertSourceType.OPENLIST) {
      currentStage = 'download';
      hooks?.onStatusChange?.(FormatConvertTaskStatus.DOWNLOADING);
      await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.DOWNLOADING, {
        last_stage: FormatConvertTaskStage.DOWNLOAD,
        workspace_dir: getFormatConvertWorkspaceDir(task.id),
        source_local_path: sourceWorkspacePath,
      });
      await downloadFormatConvertOpenlistSource(task.userId, task.source, sourceWorkspacePath);
      inputPath = sourceWorkspacePath;
    } else {
      inputPath = resolveLocalSourcePath(task);
    }

    currentStage = 'convert';
    hooks?.onStatusChange?.(FormatConvertTaskStatus.CONVERTING);
    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.CONVERTING, {
      last_stage: FormatConvertTaskStage.CONVERT,
      workspace_dir: getFormatConvertWorkspaceDir(task.id),
      source_local_path: inputPath,
      output_local_path: outputWorkspacePath,
      log_local_path: logWorkspacePath,
      started_at: new Date(),
    });

    const commandArgs = buildFormatConvertArgs(inputPath, outputWorkspacePath, normalizedOption);
    log.info('[format-convert] task converting', {
      taskId: task.id,
      mode: task.mode,
      sourceType: task.source.type,
      targetType: task.target.type,
      commandMode: task.commandMode,
      args: commandArgs,
      sourcePath: inputPath,
      outputPath: outputWorkspacePath,
    });

    await runFfmpegCommand(commandArgs, {
      logPath: logWorkspacePath,
    });

    if (task.target.type === FormatConvertTargetType.OPENLIST) {
      currentStage = 'upload';
      hooks?.onStatusChange?.(FormatConvertTaskStatus.UPLOADING);
      await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.UPLOADING, {
        last_stage: FormatConvertTaskStage.UPLOAD,
      });
      const resultOpenlistPath = await uploadFormatConvertResultToOpenlist(
        task.userId,
        task.target,
        outputWorkspacePath
      );
      await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.COMPLETED, {
        result_openlist_path: resultOpenlistPath,
        finished_at: new Date(),
        error_message: '',
      });
      log.info('[format-convert] task completed', {
        taskId: task.id,
        mode: task.mode,
        resultOpenlistPath,
        logLocalPath: logWorkspacePath,
      });
    } else {
      const resultLocalPath = await persistFormatConvertResult(task.id, outputWorkspacePath, outputFilename);
      await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.COMPLETED, {
        result_local_path: resultLocalPath,
        finished_at: new Date(),
        error_message: '',
      });
      log.info('[format-convert] task completed', {
        taskId: task.id,
        mode: task.mode,
        resultLocalPath,
        logLocalPath: logWorkspacePath,
      });
    }

    hooks?.onStatusChange?.(FormatConvertTaskStatus.COMPLETED);
  } catch (error) {
    log.error('[format-convert] task failed', {
      taskId: task.id,
      mode: task.mode,
      currentStage,
      error,
    });
    await updateFormatConvertTaskStatus(task.id, resolveStatusByStage(currentStage), {
      error_message: error instanceof Error ? error.message : String(error),
      finished_at: new Date(),
    });
    throw error;
  }
};
