import type {
  AiOpenlistFolderOrganizeItemInput,
  AiOpenlistFolderOrganizeToolInput,
  AiOpenlistFolderOrganizeToolResult,
  InternalAiMessage,
} from '../types/ai.types';

const OPENLIST_FOLDER_ORGANIZE_SYSTEM_PROMPT = `你是一个谨慎、专业的网盘目录整理助手。

你的任务：
1. 根据文件夹/文件名称、路径和递归摘要，判断当前 chunk 中每个顶层项目大概是什么内容。
2. 结合 retrievedContext 中的相似候选，识别明显重复或高度可疑重复的项目。
3. 给出保守、可执行的整理建议：保留、重命名、移动，或者移入“待人工复核的重复目录”。
4. 如果用户给了 userFeedback，并且提供了 previousPlanSummary，你必须优先参考这些修订要求，对原计划进行调整，而不是忽略用户意见。

必须遵守：
- 你只能根据输入的文本和统计摘要判断，不能假设你看过真实内容。
- 不要建议删除任何文件；如果怀疑重复，只能建议移入 duplicateFolderPath。
- 保守优先。如果证据不足，不要乱判重复。
- 本次输入采用分块分析。你只需要输出当前 chunk 里 items 的结果，不要为 retrievedContext 生成输出项。
- suggestedName 只能是文件名或目录名，不能包含路径分隔符。
- suggestedParentPath 必须是绝对路径，并且必须位于 rootPath 或 duplicateFolderPath 之下。
- 如果只是轻量重命名，action 应为 rename，且 suggestedParentPath 保持当前父目录。
- 如果需要换目录但名称不变，action 应为 move。
- 如果需要换目录且名称也需要改，action 也使用 move，并同时给出 suggestedName。
- 如果无需改动，action 使用 keep。
- classification 用简短类别，例如 anime、movie、tv、music、photo、document、archive、software、mixed、unknown。
- confidence 输出 0 到 1 的小数。
- tags 输出简短标签数组，例如 ["duplicate-suspected", "season-pack", "needs-review", "rename-only"]。

输出要求：
- 只输出 JSON。
- 顶层结构必须是：
{
  "summary": "string",
  "items": [
    {
      "id": "string",
      "classification": "string",
      "action": "keep|rename|move|move_to_duplicates",
      "suggestedName": "string",
      "suggestedParentPath": "/absolute/path",
      "duplicateGroup": "string",
      "reason": "string",
      "confidence": 0.93,
      "tags": ["string"]
    }
  ]
}
- items 必须覆盖每一个输入 id，且每个 id 只出现一次。`;

const summarizeItems = (items: AiOpenlistFolderOrganizeItemInput[]) =>
  items.map(item => ({
    id: item.id,
    name: item.name,
    path: item.path,
    relativePath: item.relativePath || '',
    parentId: item.parentId || '',
    itemType: item.itemType,
    currentParentPath: item.currentParentPath,
    depth: item.depth,
    totalFiles: item.totalFiles,
    totalDirs: item.totalDirs,
    totalSize: item.totalSize,
    maxDepth: item.maxDepth,
    extensionStats: item.extensionStats,
    samplePaths: item.samplePaths,
    note: item.note || '',
  }));

export const buildOpenlistFolderOrganizePromptMessages = (
  input: AiOpenlistFolderOrganizeToolInput
): InternalAiMessage[] => {
  const retrievedItems = Array.isArray(input.retrievedItems) ? input.retrievedItems : [];
  const globalOverview = Array.isArray(input.globalOverview)
    ? input.globalOverview.map(item => String(item || '').trim()).filter(Boolean)
    : [];
  const previousPlanSummary = Array.isArray(input.previousPlanSummary)
    ? input.previousPlanSummary.map(item => String(item || '').trim()).filter(Boolean)
    : [];

  return [
    {
      role: 'system',
      content: OPENLIST_FOLDER_ORGANIZE_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          rootPath: input.rootPath,
          duplicateFolderPath: input.duplicateFolderPath,
          chunk: {
            index: input.chunkIndex || 1,
            total: input.totalChunks || 1,
          },
          instruction:
            input.instruction?.trim() ||
            '请优先做保守整理：识别内容类别，统一较乱的名字，并把高疑似重复项目放进重复复核目录。',
          userFeedback: String(input.userFeedback || '').trim(),
          globalOverview,
          previousPlanSummary,
          retrievedContext: summarizeItems(retrievedItems),
          items: summarizeItems(input.items),
        },
        null,
        2
      ),
    },
  ];
};

const clampConfidence = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0.5;
  }
  if (num < 0) {
    return 0;
  }
  if (num > 1) {
    return 1;
  }
  return Number(num.toFixed(4));
};

const normalizeAction = (value: unknown): 'keep' | 'rename' | 'move' | 'move_to_duplicates' => {
  const action = String(value || '').trim();
  if (action === 'rename' || action === 'move' || action === 'move_to_duplicates') {
    return action;
  }
  return 'keep';
};

export const normalizeOpenlistFolderOrganizeResult = (
  input: AiOpenlistFolderOrganizeToolInput,
  raw: Partial<AiOpenlistFolderOrganizeToolResult> | null | undefined
) => {
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const rawItemMap = new Map(
    rawItems
      .map(item => {
        const id = String(item?.id || '').trim();
        return id ? [id, item] : null;
      })
      .filter(Boolean) as Array<[string, Partial<AiOpenlistFolderOrganizeToolResult['items'][number]>]>
  );

  const normalizeParentPath = (sourceParentPath: string, suggestedParentPath?: string) => {
    const fallback = sourceParentPath;
    const candidate = String(suggestedParentPath || '').trim();
    if (!candidate) {
      return fallback;
    }
    if (candidate === input.rootPath || candidate.startsWith(`${input.rootPath}/`)) {
      return candidate;
    }
    if (candidate === input.duplicateFolderPath || candidate.startsWith(`${input.duplicateFolderPath}/`)) {
      return candidate;
    }
    return fallback;
  };

  const items = input.items.map(item => {
    const rawItem = rawItemMap.get(item.id);
    const safeName =
      String(rawItem?.suggestedName || '')
        .trim()
        .replace(/[\\/]/g, '_') || item.name;
    const action = normalizeAction(rawItem?.action);
    const suggestedParentPath =
      action === 'move_to_duplicates'
        ? input.duplicateFolderPath
        : normalizeParentPath(item.currentParentPath, rawItem?.suggestedParentPath);

    return {
      id: item.id,
      classification: String(rawItem?.classification || 'unknown').trim() || 'unknown',
      action,
      suggestedName: safeName,
      suggestedParentPath,
      duplicateGroup: String(rawItem?.duplicateGroup || '').trim() || undefined,
      reason: String(rawItem?.reason || '模型未给出明确理由，建议人工复核。').trim(),
      confidence: clampConfidence(rawItem?.confidence),
      tags: Array.isArray(rawItem?.tags)
        ? rawItem.tags
            .map(tag => String(tag || '').trim())
            .filter(Boolean)
            .slice(0, 8)
        : [],
    };
  });

  return {
    summary: String(raw?.summary || '').trim() || `已分析 ${input.items.length} 个顶层项目。`,
    items,
  };
};
