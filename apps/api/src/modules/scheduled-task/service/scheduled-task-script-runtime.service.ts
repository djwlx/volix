import vm from 'node:vm';
import { badRequest } from '../../shared/http-handler';

const BLOCKED_PATTERNS = [/\bprocess\b/, /\brequire\b/, /\bchild_process\b/, /\bfs\b/, /\bimport\s*\(/];
const DEFAULT_TIMEOUT_MS = 30_000;

export const validateScheduledTaskScript = (script: string) => {
  const text = String(script || '').trim();
  if (!text) {
    badRequest('scriptContent 不能为空');
  }
  if (text.length > 20_000) {
    badRequest('scriptContent 过长');
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      badRequest('脚本包含受限能力');
    }
  }
  return text;
};

export const runScheduledTaskScript = async (script: string, context: Record<string, unknown>) => {
  const source = validateScheduledTaskScript(script);
  const sandbox = vm.createContext({
    ...context,
    process: undefined,
    require: undefined,
    global: undefined,
    globalThis: undefined,
  });
  const wrapped = new vm.Script(`(async () => { ${source} })()`);
  return wrapped.runInContext(sandbox, { timeout: DEFAULT_TIMEOUT_MS });
};
