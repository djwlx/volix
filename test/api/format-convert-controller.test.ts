import { describe, expect, it } from 'vitest';

describe('format convert controller', () => {
  it('registers local, cloud, task-list, retry, cleanup, result, log, and openlist browser endpoints', async () => {
    const route = (await import('../../apps/api/src/modules/format-convert/format-convert.route')).default;
    const stack = route.stack.map(item => `${item.methods.join(',')}:${item.path}`);

    expect(stack).toContain('POST:/format-convert/local-task');
    expect(stack).toContain('POST:/format-convert/cloud-task');
    expect(stack.some(item => item.includes('GET') && item.endsWith('/format-convert/tasks'))).toBe(true);
    expect(stack).toContain('POST:/format-convert/task/:id/retry');
    expect(stack).toContain('POST:/format-convert/task/:id/cleanup');
    expect(stack).toContain('POST:/format-convert/task/:id/delete');
    expect(stack).toContain('POST:/format-convert/tasks/delete');
    expect(stack.some(item => item.includes('GET') && item.endsWith('/format-convert/task/:id/result'))).toBe(true);
    expect(stack.some(item => item.includes('GET') && item.endsWith('/format-convert/task/:id/log'))).toBe(true);
    expect(stack.some(item => item.includes('GET') && item.endsWith('/format-convert/openlist/fs'))).toBe(true);
  });
});
