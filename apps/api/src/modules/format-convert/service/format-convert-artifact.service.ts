import fs from 'fs';
import { FormatConvertSourceType, type FormatConvertTaskItem } from '@volix/types';
import type { FormatConvertTaskEntity } from '../types/format-convert.types';

const deleteFileIfExists = async (filePath?: string) => {
  if (!filePath) {
    return;
  }
  await fs.promises.rm(filePath, { recursive: true, force: true }).catch(() => undefined);
};

export const hasFormatConvertLocalArtifacts = (
  task: Pick<
    FormatConvertTaskItem,
    'workspaceDir' | 'sourceLocalPath' | 'outputLocalPath' | 'logLocalPath' | 'resultLocalPath' | 'source'
  >
) => {
  return Boolean(
    task.workspaceDir ||
      task.sourceLocalPath ||
      task.outputLocalPath ||
      task.logLocalPath ||
      task.resultLocalPath ||
      (task.source.type === FormatConvertSourceType.UPLOAD && task.source.uploadPath)
  );
};

export const cleanupFormatConvertTaskLocalArtifacts = async (
  task: Pick<
    FormatConvertTaskItem,
    'workspaceDir' | 'sourceLocalPath' | 'outputLocalPath' | 'logLocalPath' | 'resultLocalPath' | 'source'
  >
) => {
  const paths = new Set<string>();
  if (task.workspaceDir) {
    paths.add(task.workspaceDir);
  }
  if (task.sourceLocalPath) {
    paths.add(task.sourceLocalPath);
  }
  if (task.outputLocalPath) {
    paths.add(task.outputLocalPath);
  }
  if (task.logLocalPath) {
    paths.add(task.logLocalPath);
  }
  if (task.resultLocalPath) {
    paths.add(task.resultLocalPath);
  }
  if (task.source.type === FormatConvertSourceType.UPLOAD && task.source.uploadPath) {
    paths.add(task.source.uploadPath);
  }

  for (const filePath of paths) {
    await deleteFileIfExists(filePath);
  }
};

export const buildFormatConvertCleanupPayload = (
  task: Pick<
    FormatConvertTaskItem,
    'workspaceDir' | 'sourceLocalPath' | 'outputLocalPath' | 'logLocalPath' | 'resultLocalPath' | 'source'
  >
): Partial<FormatConvertTaskEntity> => {
  const nextSource =
    task.source.type === FormatConvertSourceType.UPLOAD ? { ...task.source, uploadPath: undefined } : task.source;

  return {
    source_json: JSON.stringify(nextSource),
    workspace_dir: '',
    source_local_path: '',
    output_local_path: '',
    log_local_path: '',
    result_local_path: '',
  };
};
