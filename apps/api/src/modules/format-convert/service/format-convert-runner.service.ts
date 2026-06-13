import path from 'path';
import {
  FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS,
  FormatConvertEngine,
  FormatConvertSourceType,
  FormatConvertTargetType,
  FormatConvertTaskStage,
  FormatConvertTaskStatus,
  type FormatConvertImageOption,
  type FormatConvertMediaInfo,
} from '@volix/types';
import { buildFormatConvertArgs, probeMediaFile, runFfmpegCommand } from './format-convert-ffmpeg.service';
import { convertImageFile, probeImageFile, resolveImageOutputExtension } from './format-convert-image.service';
import { normalizeFormatConvertImageOption } from './format-convert-image-option.service';
import {
  downloadFormatConvertOpenlistSource,
  uploadFormatConvertResultToOpenlist,
} from './format-convert-openlist.service';
import {
  buildFormatConvertSummary,
  resolveFormatConvertExecutionPlan,
  type FormatConvertExecutionPlan,
} from './format-convert-option.service';
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
import { t } from '../../../utils/i18n';

const AUDIO_ONLY_OUTPUT_FORMATS = new Set(FORMAT_CONVERT_AUDIO_ONLY_OUTPUT_FORMATS);

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
  if (task.engine === FormatConvertEngine.IMAGE) {
    return runImageConvertTask(task, hooks);
  }

  const sourceWorkspaceName = `source${path.extname(task.source.fileName || '') || '.bin'}`;
  const logWorkspacePath = getFormatConvertLogPath(task.id);
  let currentStage: 'download' | 'convert' | 'upload' = 'convert';

  await ensureFormatConvertWorkspace(task.id);
  const sourceWorkspacePath = getFormatConvertWorkspaceFilePath(task.id, sourceWorkspaceName);

  try {
    let inputPath = '';
    let sourceMediaInfo: FormatConvertMediaInfo | undefined = task.sourceMediaInfo;

    if (task.source.type === FormatConvertSourceType.OPENLIST) {
      currentStage = 'download';
      hooks?.onStatusChange?.(FormatConvertTaskStatus.DOWNLOADING);
      await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.DOWNLOADING, {
        last_stage: FormatConvertTaskStage.DOWNLOAD,
        workspace_dir: getFormatConvertWorkspaceDir(task.id),
        source_local_path: sourceWorkspacePath,
      });
      await downloadFormatConvertOpenlistSource(task.userId, task.source, sourceWorkspacePath, task.requestUserAgent);
      inputPath = sourceWorkspacePath;
    } else {
      inputPath = resolveLocalSourcePath(task);
    }

    if (!sourceMediaInfo) {
      sourceMediaInfo = await probeMediaFile(inputPath);
    }
    if (AUDIO_ONLY_OUTPUT_FORMATS.has(task.option.outputFormat) && !sourceMediaInfo.hasAudio) {
      throw new Error(
        t({
          id: 'formatConvert.error.audioOutputRequiresSourceAudio',
          defaultMessage: '源文件没有音频流，无法转换为音频文件',
        })
      );
    }

    let executionPlan: FormatConvertExecutionPlan;
    try {
      executionPlan = resolveFormatConvertExecutionPlan({
        commandMode: task.commandMode,
        presetId: task.presetId,
        option: task.option,
        sourceMediaInfo,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'format-convert-audio-extract-auto-unsupported-codec') {
        throw new Error(
          t({
            id: 'formatConvert.error.audioExtractAutoUnsupportedCodec',
            defaultMessage:
              'The first audio track codec is not supported for lossless extraction by the auto audio extract preset.',
          })
        );
      }
      throw error;
    }
    const normalizedOption = executionPlan.option;
    const convertSummary = buildFormatConvertSummary({
      commandMode: task.commandMode,
      presetId: task.presetId,
      option: normalizedOption,
    });
    const outputFilename = buildOutputFilename(task, executionPlan.outputExtension);
    const outputWorkspacePath = getFormatConvertWorkspaceFilePath(task.id, `output.${executionPlan.outputExtension}`);

    currentStage = 'convert';
    hooks?.onStatusChange?.(FormatConvertTaskStatus.CONVERTING);
    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.CONVERTING, {
      last_stage: FormatConvertTaskStage.CONVERT,
      workspace_dir: getFormatConvertWorkspaceDir(task.id),
      source_local_path: inputPath,
      output_local_path: outputWorkspacePath,
      log_local_path: logWorkspacePath,
      source_media_info_json: JSON.stringify(sourceMediaInfo || {}),
      convert_summary_json: JSON.stringify(convertSummary || {}),
      started_at: new Date(),
    });

    const commandArgs = buildFormatConvertArgs(inputPath, outputWorkspacePath, normalizedOption, {
      audioTrackIndex: executionPlan.audioTrackIndex,
    });
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
    const resultMediaInfo = await probeMediaFile(outputWorkspacePath);

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
        result_media_info_json: JSON.stringify(resultMediaInfo || {}),
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
        result_media_info_json: JSON.stringify(resultMediaInfo || {}),
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

const buildImageOutputFilename = (task: FormatConvertTaskItem, extension: string) => {
  const preferred = task.target.fileName || task.source.fileName || `task-${task.id}.${extension}`;
  const baseName = preferred.replace(/\.[^.]+$/, '');
  return `${baseName}.${extension}`;
};

export const runImageConvertTask = async (task: FormatConvertTaskItem, hooks?: FormatConvertRunnerHooks) => {
  const option = normalizeFormatConvertImageOption((task.imageOption || {}) as FormatConvertImageOption);
  const extension = resolveImageOutputExtension(option.outputFormat);
  const outputWorkspaceName = `output.${extension}`;
  const outputFilename = buildImageOutputFilename(task, extension);

  await ensureFormatConvertWorkspace(task.id);
  const outputWorkspacePath = getFormatConvertWorkspaceFilePath(task.id, outputWorkspaceName);
  const inputPath = resolveLocalSourcePath(task);

  try {
    hooks?.onStatusChange?.(FormatConvertTaskStatus.CONVERTING);
    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.CONVERTING, {
      last_stage: FormatConvertTaskStage.CONVERT,
      workspace_dir: getFormatConvertWorkspaceDir(task.id),
      source_local_path: inputPath,
      output_local_path: outputWorkspacePath,
      started_at: new Date(),
    });

    await convertImageFile(inputPath, outputWorkspacePath, option);
    const resultImageInfo = await probeImageFile(outputWorkspacePath);
    const resultLocalPath = await persistFormatConvertResult(task.id, outputWorkspacePath, outputFilename);

    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.COMPLETED, {
      result_local_path: resultLocalPath,
      result_media_info_json: JSON.stringify(resultImageInfo || {}),
      finished_at: new Date(),
      error_message: '',
    });
    log.info('[format-convert] image task completed', {
      taskId: task.id,
      resultLocalPath,
    });
    hooks?.onStatusChange?.(FormatConvertTaskStatus.COMPLETED);
  } catch (error) {
    log.error('[format-convert] image task failed', { taskId: task.id, error });
    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.CONVERT_FAILED, {
      error_message: error instanceof Error ? error.message : String(error),
      finished_at: new Date(),
    });
    throw error;
  }
};
