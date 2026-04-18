import {
  registerAiInternalTool,
  resetAiInternalToolRegistryForTest,
} from '../../apps/api/src/modules/ai/service/ai-internal-tool-registry.service';
import {
  executeAiInternalTool,
  getAiFrontendToolCatalog,
  getAiModelToolCatalog,
} from '../../apps/api/src/modules/ai/service/ai-internal-tool-executor.service';

describe('ai internal tool runtime', () => {
  beforeEach(() => {
    resetAiInternalToolRegistryForTest();
  });

  test('returns separate model and frontend catalogs', () => {
    registerAiInternalTool({
      name: 'config.resolve_secret',
      description: 'hidden',
      category: 'config',
      riskLevel: 'read',
      requiresApproval: false,
      hiddenFromFrontend: true,
      inputSchema: {},
      execute: async () => ({
        internalResult: { password: 'secret' },
      }),
    });

    expect(getAiModelToolCatalog().map(item => item.name)).toContain('config.resolve_secret');
    expect(getAiFrontendToolCatalog().map(item => item.name)).not.toContain('config.resolve_secret');
  });

  test('requires approval for write tools and returns frontend summary', async () => {
    registerAiInternalTool({
      name: 'qbit.delete_torrents',
      description: 'delete torrents',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        hashes: 'array',
      },
      summarizeForFrontend: input => ({
        hashes: input.hashes,
      }),
      execute: async () => ({
        internalResult: { cookie: 'SID=secret', ok: true },
      }),
    });

    const result = await executeAiInternalTool(
      'qbit.delete_torrents',
      {
        user: { id: '1', role: 'admin' as any },
      },
      { hashes: ['abc'] },
      { allowWriteExecution: false }
    );

    expect(result.status).toBe('waiting_approval');
    expect(result.frontendSummary).toEqual({ hashes: ['abc'] });
  });
});
