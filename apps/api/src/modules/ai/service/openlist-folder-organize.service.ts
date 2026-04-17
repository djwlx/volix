import {
  buildOpenlistFolderOrganizePromptMessages,
  normalizeOpenlistFolderOrganizeResult,
} from '../prompt/openlist-folder-organize.prompt';
import { createAiTraceId, logAiEvent } from './ai-log.service';
import { runInternalAiJson } from './ai-client.service';
import type { AiOpenlistFolderOrganizeToolInput, AiOpenlistFolderOrganizeToolResult } from '../types/ai.types';

export const runAiOpenlistFolderOrganizeTool = async (
  input: AiOpenlistFolderOrganizeToolInput
): Promise<AiOpenlistFolderOrganizeToolResult> => {
  const traceId = createAiTraceId('openlist_folder_organize');
  const items = input.items
    .map(item => ({
      id: String(item.id || '').trim(),
      name: String(item.name || '').trim(),
      path: String(item.path || '').trim(),
      relativePath: String(item.relativePath || '').trim(),
      parentId: String(item.parentId || '').trim(),
      itemType: item.itemType,
      currentParentPath: String(item.currentParentPath || '').trim(),
      depth: Number(item.depth || 0),
      totalFiles: Number(item.totalFiles || 0),
      totalDirs: Number(item.totalDirs || 0),
      totalSize: Number(item.totalSize || 0),
      maxDepth: Number(item.maxDepth || 0),
      samplePaths: Array.isArray(item.samplePaths)
        ? item.samplePaths
            .map(pathItem => String(pathItem || '').trim())
            .filter(Boolean)
            .slice(0, 16)
        : [],
      extensionStats: Array.isArray(item.extensionStats)
        ? item.extensionStats
            .map(ext => String(ext || '').trim())
            .filter(Boolean)
            .slice(0, 8)
        : [],
      note: String(item.note || '').trim(),
    }))
    .filter(item => item.id && item.name && item.path && item.currentParentPath);

  if (items.length === 0) {
    logAiEvent(traceId, 'skip', {
      toolName: 'openlist_folder_organize',
      reason: 'no_valid_items',
    });
    return {
      summary: '没有可分析的目录项。',
      items: [],
    };
  }

  const normalizedInput: AiOpenlistFolderOrganizeToolInput = {
    ...input,
    items,
    retrievedItems: Array.isArray(input.retrievedItems)
      ? input.retrievedItems
          .map(item => ({
            id: String(item.id || '').trim(),
            name: String(item.name || '').trim(),
            path: String(item.path || '').trim(),
            relativePath: String(item.relativePath || '').trim(),
            parentId: String(item.parentId || '').trim(),
            itemType: item.itemType,
            currentParentPath: String(item.currentParentPath || '').trim(),
            depth: Number(item.depth || 0),
            totalFiles: Number(item.totalFiles || 0),
            totalDirs: Number(item.totalDirs || 0),
            totalSize: Number(item.totalSize || 0),
            maxDepth: Number(item.maxDepth || 0),
            samplePaths: Array.isArray(item.samplePaths)
              ? item.samplePaths
                  .map(pathItem => String(pathItem || '').trim())
                  .filter(Boolean)
                  .slice(0, 12)
              : [],
            extensionStats: Array.isArray(item.extensionStats)
              ? item.extensionStats
                  .map(ext => String(ext || '').trim())
                  .filter(Boolean)
                  .slice(0, 8)
              : [],
            note: String(item.note || '').trim(),
          }))
          .filter(item => item.id && item.name && item.path && item.currentParentPath)
      : [],
  };
  const messages = buildOpenlistFolderOrganizePromptMessages(normalizedInput);

  logAiEvent(traceId, 'start', {
    toolName: 'openlist_folder_organize',
    itemCount: normalizedInput.items.length,
    retrievedItemCount: normalizedInput.retrievedItems?.length || 0,
    rootPath: normalizedInput.rootPath,
    duplicateFolderPath: normalizedInput.duplicateFolderPath,
    chunkIndex: normalizedInput.chunkIndex || 1,
    totalChunks: normalizedInput.totalChunks || 1,
    model: normalizedInput.model || '',
  });

  const rawResult = await runInternalAiJson<AiOpenlistFolderOrganizeToolResult>(messages, {
    model: input.model,
    temperature: 0.1,
    traceId,
    toolName: 'openlist_folder_organize',
  });

  const result = normalizeOpenlistFolderOrganizeResult(normalizedInput, rawResult);

  logAiEvent(traceId, 'finish', {
    toolName: 'openlist_folder_organize',
    summary: result.summary,
    items: result.items,
  });

  return result;
};
