export type AiConversationStatus = 'active' | 'archived';

export type AiChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type AiChatMessageStatus = 'pending' | 'streaming' | 'completed' | 'failed';

export type AiRunStatus = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';

export type AiToolRiskLevel = 'read' | 'write_low' | 'write_high';

export type AiToolCallStatus = 'queued' | 'waiting_approval' | 'running' | 'completed' | 'failed' | 'rejected';

export interface AiConversationSummary {
  id: string;
  title: string;
  status: AiConversationStatus;
  userId: string;
  latestRunStatus?: AiRunStatus | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationDetail extends AiConversationSummary {
  latestRunStatus?: AiRunStatus | null;
}

export interface AiChatMessage {
  id: string;
  conversationId: string;
  runId?: string | null;
  toolCallId?: string | null;
  role: AiChatMessageRole;
  content: string;
  status: AiChatMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiRun {
  id: string;
  conversationId: string;
  triggerMessageId: string;
  status: AiRunStatus;
  model?: string | null;
  currentStep: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiToolCall {
  id: string;
  conversationId: string;
  runId: string;
  toolName: string;
  riskLevel: AiToolRiskLevel;
  status: AiToolCallStatus;
  requiresApproval: boolean;
  arguments: Record<string, unknown>;
  result?: unknown;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiEvent {
  id: string;
  conversationId: string;
  runId?: string | null;
  sequence: number;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  riskLevel: AiToolRiskLevel;
  requiresApproval: boolean;
  inputSchema: Record<string, unknown>;
  category?: string;
}

export interface CreateAiConversationPayload {
  title?: string;
}

export interface SendAiMessagePayload {
  content: string;
}

export interface UpdateAiConversationPayload {
  title?: string;
  status?: AiConversationStatus;
}

export interface AiConversationListResponse {
  items: AiConversationSummary[];
}

export interface AiMessageListResponse {
  items: AiChatMessage[];
}

export interface AiRunListResponse {
  items: AiRun[];
}

export interface AiToolCallListResponse {
  items: AiToolCall[];
}

export interface AiEventListResponse {
  items: AiEvent[];
}

export interface AiToolDefinitionListResponse {
  items: AiToolDefinition[];
}

export interface SendAiMessageResponse {
  conversation: AiConversationDetail;
  message: AiChatMessage;
  run: AiRun;
}

export interface RetryAiRunResponse {
  conversation: AiConversationDetail;
  triggerMessage: AiChatMessage;
  run: AiRun;
}

export interface ApproveAiToolCallPayload {
  approved: boolean;
}

export interface DeleteAiConversationResponse {
  id: string;
  deleted: boolean;
}
