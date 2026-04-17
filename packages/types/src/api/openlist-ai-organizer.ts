export type OpenlistAiOrganizerItemType = 'file' | 'directory';

export type OpenlistAiOrganizerAction = 'keep' | 'rename' | 'move' | 'move_to_duplicates';

export interface OpenlistAiOrganizerBrowseItem {
  name: string;
  path: string;
  isLeaf: boolean;
}

export interface OpenlistAiOrganizerBrowseResponse {
  path: string;
  items: OpenlistAiOrganizerBrowseItem[];
}

export interface AnalyzeOpenlistAiOrganizerPayload {
  rootPath: string;
  duplicateFolderName?: string;
  model?: string;
  userInstruction?: string;
  basedOnTaskId?: string;
}

export type OpenlistAiOrganizerTaskType = 'analyze' | 'execute';

export type OpenlistAiOrganizerTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface OpenlistAiOrganizerPlanItem {
  id: string;
  parentId?: string;
  depth: number;
  sourcePath: string;
  sourceRelativePath: string;
  sourceName: string;
  sourceParentPath: string;
  itemType: OpenlistAiOrganizerItemType;
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  samplePaths: string[];
  classification: string;
  action: OpenlistAiOrganizerAction;
  suggestedName: string;
  suggestedParentPath: string;
  suggestedPath: string;
  suggestedRelativePath: string;
  hasChange: boolean;
  changeFlags: string[];
  duplicateGroup?: string;
  reason: string;
  confidence: number;
  tags: string[];
}

export interface AnalyzeOpenlistAiOrganizerResponse {
  rootPath: string;
  duplicateFolderPath: string;
  summary: string;
  totalEntries: number;
  topLevelItemCount: number;
  plannedItemCount: number;
  actionCount: number;
  duplicateCount: number;
  items: OpenlistAiOrganizerPlanItem[];
}

export interface ExecuteOpenlistAiOrganizerPayload {
  rootPath: string;
  duplicateFolderName?: string;
  items: OpenlistAiOrganizerPlanItem[];
}

export interface OpenlistAiOrganizerExecuteItemResult {
  id: string;
  sourcePath: string;
  targetPath: string;
  status: 'applied' | 'skipped' | 'failed';
  message: string;
}

export interface ExecuteOpenlistAiOrganizerResponse {
  rootPath: string;
  duplicateFolderPath: string;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  items: OpenlistAiOrganizerExecuteItemResult[];
}

export interface CreateOpenlistAiOrganizerAnalyzeTaskResponse {
  taskId: string;
}

export interface ReviseOpenlistAiOrganizerAnalyzeTaskPayload {
  feedback: string;
}

export interface CreateOpenlistAiOrganizerReviseTaskResponse {
  taskId: string;
}

export interface CreateOpenlistAiOrganizerExecuteTaskResponse {
  taskId: string;
}

export interface CreateOpenlistAiOrganizerRetryTaskResponse {
  taskId: string;
}

export interface OpenlistAiOrganizerTaskSummary {
  id: string;
  type: OpenlistAiOrganizerTaskType;
  status: OpenlistAiOrganizerTaskStatus;
  rootPath: string;
  duplicateFolderName: string;
  basedOnTaskId?: string;
  summary?: string;
  currentStage?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  updatedAt: string;
}

export interface OpenlistAiOrganizerTaskDetail extends OpenlistAiOrganizerTaskSummary {
  analyzePayload?: AnalyzeOpenlistAiOrganizerPayload;
  executePayload?: ExecuteOpenlistAiOrganizerPayload;
  analysisResult?: AnalyzeOpenlistAiOrganizerResponse;
  executionResult?: ExecuteOpenlistAiOrganizerResponse;
}

export interface OpenlistAiOrganizerTaskListResponse {
  items: OpenlistAiOrganizerTaskSummary[];
}
