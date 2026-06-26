import { describe, expect, it } from 'vitest';

describe('user forgot password route', () => {
  it('registers public forgot password endpoints', async () => {
    const route = (await import('../../apps/api/src/modules/user/user.route')).default;
    const stack = route.stack.map(item => `${item.methods.join(',')}:${item.path}`);

    expect(stack).toContain('POST:/user/forgot-password-code');
    expect(stack).toContain('POST:/user/reset-password');
  });
});
