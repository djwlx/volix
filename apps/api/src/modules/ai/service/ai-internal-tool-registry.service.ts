import type { AiInternalToolDefinition } from './ai-internal-tool.types';

const registry = new Map<string, AiInternalToolDefinition>();

export const registerAiInternalTool = (tool: AiInternalToolDefinition) => {
  registry.set(tool.name, tool);
};

export const registerAiInternalTools = (tools: AiInternalToolDefinition[]) => {
  for (const tool of tools) {
    registerAiInternalTool(tool);
  }
};

export const getAiInternalTool = (name: string) => {
  return registry.get(name);
};

export const listAiInternalTools = () => {
  return [...registry.values()];
};

export const resetAiInternalToolRegistryForTest = () => {
  registry.clear();
};
