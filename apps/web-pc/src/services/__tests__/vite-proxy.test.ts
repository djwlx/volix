import { describe, expect, it } from 'vitest';
import type { ConfigEnv, UserConfig } from 'vite';
import viteConfigExport from '../../../vite.config';

const viteConfig = viteConfigExport as UserConfig | ((env: ConfigEnv) => UserConfig);

describe('vite websocket proxy', () => {
  it('proxies the business websocket endpoint to the backend server', () => {
    const server =
      typeof viteConfig === 'function' ? viteConfig({ command: 'serve', isSsrBuild: false, mode: 'test' }) : viteConfig;
    const wsProxy = server.server?.proxy?.['/ws'];

    expect(wsProxy).toBeDefined();
    expect(typeof wsProxy).toBe('object');
    const wsProxyOptions = wsProxy as Exclude<typeof wsProxy, string | undefined>;
    expect(wsProxyOptions.target).toBe('http://localhost:3000');
    expect(wsProxyOptions.ws).toBe(true);
  });
});
