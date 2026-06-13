import { describe, expect, it } from 'vitest';
import viteConfig from '../../../vite.config';

describe('vite websocket proxy', () => {
  it('proxies the business websocket endpoint to the backend server', () => {
    const server =
      typeof viteConfig === 'function' ? viteConfig({ command: 'serve', isSsrBuild: false, mode: 'test' }) : viteConfig;
    const wsProxy = server.server?.proxy?.['/ws'];

    expect(wsProxy).toBeDefined();
    expect(wsProxy?.target).toBe('http://localhost:3000');
    expect(wsProxy?.ws).toBe(true);
  });
});
