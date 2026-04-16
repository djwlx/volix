import { buildScreenAndRenamePromptMessages, normalizeScreenAndRenameResult } from '../prompt/screen-and-rename.prompt';
import { createAiTraceId, logAiEvent } from './ai-log.service';
import { runInternalAiJson } from './ai-client.service';
import type { AiScreenAndRenameToolInput, AiScreenAndRenameToolResult } from '../types/ai.types';

export const runAiScreenAndRenameTool = async (
  input: AiScreenAndRenameToolInput
): Promise<AiScreenAndRenameToolResult> => {
  const traceId = createAiTraceId('screen_and_rename');
  const items = input.items
    .map(item => ({
      id: String(item.id || '').trim(),
      name: String(item.name || '').trim(),
      path: String(item.path || '').trim(),
      note: String(item.note || '').trim(),
    }))
    .filter(item => item.id && item.name);

  if (items.length === 0) {
    logAiEvent(traceId, 'skip', {
      toolName: 'screen_and_rename',
      reason: 'no_valid_items',
    });
    return {
      summary: '没有可处理的文件项。',
      items: [],
    };
  }

  const normalizedInput: AiScreenAndRenameToolInput = {
    ...input,
    items,
  };
  const messages = buildScreenAndRenamePromptMessages(normalizedInput);

  logAiEvent(traceId, 'start', {
    toolName: 'screen_and_rename',
    itemCount: normalizedInput.items.length,
    model: input.model || '',
    instruction: normalizedInput.instruction || '',
    items: normalizedInput.items,
  });

  const rawResult = await runInternalAiJson<AiScreenAndRenameToolResult>(messages, {
    model: input.model,
    temperature: 0.1,
    traceId,
    toolName: 'screen_and_rename',
  });

  const result = normalizeScreenAndRenameResult(normalizedInput, rawResult);

  logAiEvent(traceId, 'finish', {
    toolName: 'screen_and_rename',
    summary: result.summary,
    items: result.items,
  });

  return result;
};
