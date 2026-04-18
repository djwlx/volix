import type { AiVisibleToolDefinition } from './ai-internal-tool.types';
import { listAiInternalTools } from './ai-internal-tool-registry.service';

const toVisibleToolDefinition = (tool: {
  name: string;
  description: string;
  category: string;
  riskLevel: string;
  requiresApproval: boolean;
  inputSchema: Record<string, unknown>;
}): AiVisibleToolDefinition => {
  return {
    name: tool.name,
    description: tool.description,
    category: tool.category,
    riskLevel: tool.riskLevel as AiVisibleToolDefinition['riskLevel'],
    requiresApproval: tool.requiresApproval,
    inputSchema: tool.inputSchema,
  };
};

export const getAiModelToolCatalog = (): AiVisibleToolDefinition[] => {
  return listAiInternalTools().map(toVisibleToolDefinition);
};

export const getAiFrontendToolCatalog = (): AiVisibleToolDefinition[] => {
  return listAiInternalTools()
    .filter(tool => !tool.hiddenFromFrontend)
    .map(toVisibleToolDefinition);
};
