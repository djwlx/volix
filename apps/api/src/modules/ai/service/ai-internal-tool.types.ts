import type { AiToolDefinition, AiToolRiskLevel, UserRole } from '@volix/types';

export interface AiInternalToolExecutionContext {
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  };
  requestUserAgent?: string;
}

export interface AiInternalToolExecutionResult {
  internalResult: unknown;
  modelResult?: unknown;
  frontendResult?: unknown;
}

export interface AiInternalToolDefinition {
  name: string;
  description: string;
  category: 'config' | 'sdk' | 'api' | 'business';
  riskLevel: AiToolRiskLevel;
  requiresApproval: boolean;
  inputSchema: Record<string, unknown>;
  hiddenFromFrontend?: boolean;
  execute: (
    context: AiInternalToolExecutionContext,
    input: Record<string, unknown>
  ) => Promise<AiInternalToolExecutionResult>;
  summarizeForFrontend?: (input: Record<string, unknown>) => Record<string, unknown>;
}

export interface AiInternalResolvedToolResult {
  internalResult: unknown;
  modelResult: unknown;
  frontendResult: unknown;
}

export interface AiVisibleToolDefinition extends AiToolDefinition {
  category?: string;
}
