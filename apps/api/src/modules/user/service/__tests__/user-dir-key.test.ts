import { describe, expect, it } from 'vitest';
import { buildUserDirKey } from '../user.service';

describe('buildUserDirKey', () => {
  it('returns a filesystem-safe stable key for the same seed', () => {
    const first = buildUserDirKey('user-123');
    const second = buildUserDirKey('user-123');

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-z0-9_-]+$/);
    expect(first).toHaveLength(24);
  });

  it('produces different keys for different seeds', () => {
    expect(buildUserDirKey('user-a')).not.toBe(buildUserDirKey('user-b'));
  });
});
