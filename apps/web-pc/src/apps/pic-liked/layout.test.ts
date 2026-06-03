import { describe, expect, it } from 'vitest';
import { getLikedWallCompactThreshold, shouldUseLikedWallCompactLayout } from './layout';

describe('liked wall layout', () => {
  it('uses compact horizontal layout when item count is below the desktop column threshold', () => {
    expect(getLikedWallCompactThreshold(false)).toBe(4);
    expect(shouldUseLikedWallCompactLayout(1, false)).toBe(true);
    expect(shouldUseLikedWallCompactLayout(4, false)).toBe(true);
    expect(shouldUseLikedWallCompactLayout(5, false)).toBe(false);
  });

  it('uses a smaller compact threshold on mobile', () => {
    expect(getLikedWallCompactThreshold(true)).toBe(2);
    expect(shouldUseLikedWallCompactLayout(2, true)).toBe(true);
    expect(shouldUseLikedWallCompactLayout(3, true)).toBe(false);
  });
});
