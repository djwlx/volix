export interface InternalAiAccountConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type InternalAiRole = 'system' | 'user' | 'assistant';

export interface InternalAiMessage {
  role: InternalAiRole;
  content: string;
}

export interface InternalAiChatOptions {
  model?: string;
  temperature?: number;
  traceId?: string;
  toolName?: string;
}

export interface InternalAiToolContext {
  model?: string;
  instruction?: string;
}

export interface AiScreenAndRenameItemInput {
  id: string;
  name: string;
  path?: string;
  note?: string;
}

export interface AiScreenAndRenameToolInput extends InternalAiToolContext {
  items: AiScreenAndRenameItemInput[];
}

export interface AiScreenAndRenameItemResult {
  id: string;
  keep: boolean;
  suggestedName: string;
  reason: string;
  confidence: number;
  tags: string[];
}

export interface AiScreenAndRenameToolResult {
  summary: string;
  items: AiScreenAndRenameItemResult[];
}
