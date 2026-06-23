import { describe, expect, it } from 'vitest';

describe('user ai translate route', () => {
  it('registers the authenticated ai translate endpoint', async () => {
    const route = (await import('../../apps/api/src/modules/user/user.route')).default;
    const stack = route.stack.map(item => `${item.methods.join(',')}:${item.path}`);

    expect(stack).toContain('POST:/user/ai/translate');
  });
});
