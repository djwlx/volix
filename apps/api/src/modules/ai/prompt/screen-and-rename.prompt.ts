import type {
  AiScreenAndRenameItemInput,
  AiScreenAndRenameToolInput,
  AiScreenAndRenameToolResult,
  InternalAiMessage,
} from '../types/ai.types';

const SCREEN_AND_RENAME_SYSTEM_PROMPT = `你是一个谨慎、专业的文件整理助手，专门根据“文件名、路径、备注”做批量筛选与重命名建议。

你的目标：
1. 判断文件是否建议保留。
2. 给出一个更干净、更稳定、更可读的建议文件名。
3. 说明判断理由，但不要编造文件内容。

必须遵守：
- 你只能根据用户提供的文本信息判断，绝不能假设你看到了真实文件内容。
- 如果信息不足，优先保守：尽量 keep=true，并做轻量清理式重命名。
- 如果文件名带扩展名，suggestedName 必须保留原扩展名。
- suggestedName 只能是文件名，不能包含目录分隔符。
- 删除噪音信息时要谨慎，例如多余空格、重复标点、常见下载站尾巴、明显 hash 串、无意义括号标签。
- 不要凭空补充演员名、剧情名、拍摄地、站点外的元数据。
- 如果判断不建议保留，suggestedName 置为空字符串。
- confidence 输出 0 到 1 之间的小数。
- tags 输出简短标签数组，例如 ["clean", "duplicate-suspected", "ad-like", "series", "needs-review"]。

输出要求：
- 只输出 JSON。
- 顶层结构必须是：
{
  "summary": "string",
  "items": [
    {
      "id": "string",
      "keep": true,
      "suggestedName": "string",
      "reason": "string",
      "confidence": 0.93,
      "tags": ["string"]
    }
  ]
}
- items 必须覆盖每一个输入 id，且每个 id 只出现一次。`;

const formatInputItems = (items: AiScreenAndRenameItemInput[]) => {
  return items
    .map(item =>
      JSON.stringify({
        id: item.id,
        name: item.name,
        path: item.path || '',
        note: item.note || '',
      })
    )
    .join('\n');
};

export const buildScreenAndRenamePromptMessages = (input: AiScreenAndRenameToolInput): InternalAiMessage[] => {
  const instruction = input.instruction?.trim();

  return [
    {
      role: 'system',
      content: SCREEN_AND_RENAME_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `请处理下面这批文件。

业务补充要求：
${instruction || '没有额外要求。请使用通用、保守、可执行的筛选和重命名策略。'}

输入文件列表（每行一个 JSON 对象）：
${formatInputItems(input.items)}

请直接返回 JSON。`,
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

export const normalizeScreenAndRenameResult = (
  input: AiScreenAndRenameToolInput,
  raw: Partial<AiScreenAndRenameToolResult> | null | undefined
) => {
  const sourceMap = new Map(input.items.map(item => [item.id, item]));
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const rawItemMap = new Map(
    rawItems
      .map(item => {
        const id = String(item?.id || '').trim();
        if (!id) {
          return null;
        }
        return [id, item] as const;
      })
      .filter(Boolean) as Array<[string, Partial<AiScreenAndRenameToolResult['items'][number]>]>
  );

  const items = input.items.map(item => {
    const rawItem = rawItemMap.get(item.id);
    const sourceName = item.name.trim();
    const extensionMatch = sourceName.match(/(\.[^./\\]+)$/);
    const extension = extensionMatch?.[1] || '';
    const suggestedName = String(rawItem?.suggestedName || '').trim();
    const normalizedSuggestedName =
      rawItem?.keep === false ? '' : suggestedName ? suggestedName.replace(/[\\/]/g, '_') : sourceName;

    const safeSuggestedName =
      normalizedSuggestedName && extension && !normalizedSuggestedName.endsWith(extension)
        ? `${normalizedSuggestedName}${extension}`
        : normalizedSuggestedName;

    return {
      id: item.id,
      keep: rawItem?.keep !== false,
      suggestedName: rawItem?.keep === false ? '' : safeSuggestedName,
      reason: String(rawItem?.reason || '模型未给出明确理由，建议人工复核。').trim(),
      confidence: clampConfidence(rawItem?.confidence),
      tags: Array.isArray(rawItem?.tags)
        ? rawItem.tags
            .map(tag => String(tag || '').trim())
            .filter(Boolean)
            .slice(0, 6)
        : [],
    };
  });

  const summary = String(raw?.summary || '').trim() || `已处理 ${sourceMap.size} 个文件项。`;

  return {
    summary,
    items,
  };
};
