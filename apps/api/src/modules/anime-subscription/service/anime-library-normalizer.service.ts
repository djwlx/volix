import path from 'path';
import { runAiScreenAndRenameTool } from '../../ai/service/ai-tool.service';
import { logAnimeError, logAnimeEvent } from './anime-log.service';
import { scanExistingAnimeLibrary, type AnimeLibraryEntry } from './anime-library.service';

const BATCH_SIZE = 12;
const NORMALIZED_SEASON_DIR_REGEXP = /^S\d{2}$/i;
const NORMALIZED_EPISODE_FILE_REGEXP = /^S\d{2}E\d{2,3}\.[a-z0-9]+$/i;

const chunk = <T>(list: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }
  return chunks;
};

const shouldSkipEntry = (entry: AnimeLibraryEntry, seriesRootPath: string) => {
  return entry.path === seriesRootPath || entry.relativePath === '.';
};

const shouldAskAiToNormalize = (entry: AnimeLibraryEntry) => {
  if (entry.isDir) {
    return !NORMALIZED_SEASON_DIR_REGEXP.test(entry.name);
  }

  return !NORMALIZED_EPISODE_FILE_REGEXP.test(entry.name);
};

export const normalizeExistingAnimeLibraryWithAi = async (
  subscriptionId: string | number,
  params: {
    subscriptionName: string;
    seriesRootPath: string;
    renamePattern: string;
  }
) => {
  const seriesRootPath = String(params.seriesRootPath || '').trim();
  if (!seriesRootPath) {
    return {
      renamedCount: 0,
      skipped: true,
      reason: 'series_root_path_empty',
    };
  }

  const initialScan = await scanExistingAnimeLibrary(seriesRootPath);
  if (!initialScan.rootExists || initialScan.entries.length === 0) {
    return {
      renamedCount: 0,
      skipped: true,
      reason: initialScan.rootExists ? 'library_empty' : 'series_root_path_not_found',
    };
  }

  const candidates = initialScan.entries
    .filter(entry => !shouldSkipEntry(entry, seriesRootPath))
    .filter(shouldAskAiToNormalize)
    .sort((a, b) => b.depth - a.depth);
  if (candidates.length === 0) {
    return {
      renamedCount: 0,
      skipped: true,
      reason: 'no_entries_to_normalize',
    };
  }

  let renamedCount = 0;
  const batches = chunk(candidates, BATCH_SIZE);

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      const result = await runAiScreenAndRenameTool({
        instruction: `这是自动追番中的“现有番剧目录命名校正”任务。目标番剧是“${params.subscriptionName}”，最终目录是“${seriesRootPath}”，期望命名规则参考“${params.renamePattern}”。

请只做保守命名清理：
- 不要删除任何项目，默认都应 keep=true。
- 对目录名和文件名做轻量规范化。
- 如果命名已经合理，请保持不变。
- 不要改变扩展名。
- 不要凭空补充不存在的季集信息。
- 如果是明显错误、乱码、杂乱尾缀、重复标记，可以建议更稳定的名称。`,
        items: batch.map((entry, index) => ({
          id: `${batchIndex}-${index}`,
          name: entry.name,
          path: entry.path,
          note: `${entry.isDir ? 'directory' : 'file'} | relative=${entry.relativePath}`,
        })),
      });

      const renameMap = new Map(
        result.items.map(item => [
          item.id,
          {
            suggestedName: item.suggestedName,
            reason: item.reason,
            keep: item.keep,
          },
        ])
      );

      for (const entry of batch) {
        const mappedIndex = batch.findIndex(candidate => candidate.path === entry.path);
        if (mappedIndex < 0) {
          continue;
        }
        const decision = renameMap.get(`${batchIndex}-${mappedIndex}`);
        const nextName = String(decision?.suggestedName || '').trim();
        if (!nextName || nextName === entry.name) {
          continue;
        }

        try {
          await initialScan.sdk.rename({
            path: entry.path,
            name: nextName,
          });
          renamedCount += 1;
          logAnimeEvent(subscriptionId, 'library_rename_applied', {
            path: entry.path,
            from: entry.name,
            to: nextName,
            reason: decision?.reason || '',
          });
        } catch (error) {
          logAnimeError(subscriptionId, 'library_rename_error', error, {
            path: entry.path,
            from: entry.name,
            to: nextName,
          });
        }
      }
    } catch (error) {
      logAnimeError(subscriptionId, 'library_normalize_ai_error', error, {
        batchIndex,
        batchSize: batch.length,
      });
    }
  }

  return {
    renamedCount,
    skipped: false,
    reason: '',
  };
};
