import { badRequest } from '../../shared/http-handler';
import type { AiInternalResolvedToolResult, AiInternalToolExecutionContext } from './ai-internal-tool.types';
import { getAiFrontendToolCatalog, getAiModelToolCatalog } from './ai-internal-tool-catalog.service';
import { getAiInternalTool } from './ai-internal-tool-registry.service';
import { sanitizeInternalToolResult } from './ai-internal-tool-sanitizer.service';

interface ExecuteAiInternalToolOptions {
  allowWriteExecution?: boolean;
}

interface WaitingApprovalAiInternalToolResult {
  status: 'waiting_approval';
  frontendSummary: unknown;
}

interface CompletedAiInternalToolResult extends AiInternalResolvedToolResult {
  status: 'completed';
}

export type ExecuteAiInternalToolResult = WaitingApprovalAiInternalToolResult | CompletedAiInternalToolResult;

export const executeAiInternalTool = async (
  name: string,
  context: AiInternalToolExecutionContext,
  input: Record<string, unknown>,
  options: ExecuteAiInternalToolOptions = {}
): Promise<ExecuteAiInternalToolResult> => {
  const tool = getAiInternalTool(name);
  if (!tool) {
    badRequest(`工具不存在: ${name}`);
    throw new Error('unreachable');
  }

  if (tool.requiresApproval && !options.allowWriteExecution) {
    return {
      status: 'waiting_approval',
      frontendSummary: tool.summarizeForFrontend ? tool.summarizeForFrontend(input) : sanitizeInternalToolResult(input),
    };
  }

  const executed = await tool.execute(context, input);
  return {
    status: 'completed',
    internalResult: executed.internalResult,
    modelResult: sanitizeInternalToolResult(executed.modelResult ?? executed.internalResult),
    frontendResult: sanitizeInternalToolResult(
      executed.frontendResult ?? executed.modelResult ?? executed.internalResult
    ),
  };
};

export { getAiFrontendToolCatalog, getAiModelToolCatalog };
