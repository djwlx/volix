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

export interface AiOpenlistFolderOrganizeItemInput {
  id: string;
  name: string;
  path: string;
  relativePath?: string;
  parentId?: string;
  itemType: 'file' | 'directory';
  currentParentPath: string;
  depth: number;
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  maxDepth: number;
  samplePaths: string[];
  extensionStats: string[];
  note?: string;
}

export interface AiOpenlistFolderOrganizeToolInput extends InternalAiToolContext {
  rootPath: string;
  duplicateFolderPath: string;
  chunkIndex?: number;
  totalChunks?: number;
  globalOverview?: string[];
  retrievedItems?: AiOpenlistFolderOrganizeItemInput[];
  previousPlanSummary?: string[];
  userFeedback?: string;
  items: AiOpenlistFolderOrganizeItemInput[];
}

export interface AiOpenlistFolderOrganizeItemResult {
  id: string;
  classification: string;
  action: 'keep' | 'rename' | 'move' | 'move_to_duplicates';
  suggestedName: string;
  suggestedParentPath: string;
  duplicateGroup?: string;
  reason: string;
  confidence: number;
  tags: string[];
}

export interface AiOpenlistFolderOrganizeToolResult {
  summary: string;
  items: AiOpenlistFolderOrganizeItemResult[];
}
