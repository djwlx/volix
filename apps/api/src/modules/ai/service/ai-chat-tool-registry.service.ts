import type { AiInternalToolExecutionContext } from './ai-internal-tool.types';
import { ensureAiInternalToolsBootstrapped } from './ai-internal-tool-bootstrap.service';
import {
  executeAiInternalTool,
  getAiFrontendToolCatalog,
  getAiModelToolCatalog,
} from './ai-internal-tool-executor.service';
import { getAiInternalTool } from './ai-internal-tool-registry.service';

export type AiToolExecutionContext = AiInternalToolExecutionContext;

export const listAiRegisteredTools = () => {
  ensureAiInternalToolsBootstrapped();
  return getAiFrontendToolCatalog();
};

export const listAiModelTools = () => {
  ensureAiInternalToolsBootstrapped();
  return getAiModelToolCatalog();
};

export const getAiRegisteredTool = (name: string) => {
  ensureAiInternalToolsBootstrapped();
  return getAiInternalTool(name);
};

export const executeAiRegisteredTool = async (
  name: string,
  context: AiToolExecutionContext,
  input: Record<string, unknown>
) => {
  ensureAiInternalToolsBootstrapped();
  const result = await executeAiInternalTool(name, context, input, {
    allowWriteExecution: true,
  });
  if (result.status !== 'completed') {
    return {
      summary: result.frontendSummary,
    };
  }
  return result.modelResult;
};
