import { registerAiInternalTools } from './ai-internal-tool-registry.service';
import { buildAnimeInternalTools } from './ai-internal-tool-builtins/anime-tools';
import { buildBangumiInternalTools } from './ai-internal-tool-builtins/bangumi-tools';
import { buildCloud115InternalTools } from './ai-internal-tool-builtins/cloud115-tools';
import { buildConfigInternalTools } from './ai-internal-tool-builtins/config-tools';
import { buildOpenlistInternalTools } from './ai-internal-tool-builtins/openlist-tools';
import { buildOpenlistSdkInternalTools } from './ai-internal-tool-builtins/openlist-sdk-tools';
import { buildQbitInternalTools } from './ai-internal-tool-builtins/qbit-tools';
import { buildScheduledTaskInternalTools } from './ai-internal-tool-builtins/scheduled-task-tools';

let bootstrapped = false;

export const ensureAiInternalToolsBootstrapped = () => {
  if (bootstrapped) {
    return;
  }

  registerAiInternalTools([
    ...buildAnimeInternalTools(),
    ...buildBangumiInternalTools(),
    ...buildOpenlistInternalTools(),
    ...buildOpenlistSdkInternalTools(),
    ...buildCloud115InternalTools(),
    ...buildConfigInternalTools(),
    ...buildQbitInternalTools(),
    ...buildScheduledTaskInternalTools(),
  ]);
  bootstrapped = true;
};
