import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserModel } from '../../model/user.model';
import { getUserDirKeyById, resolveUserDirKeyOrThrow } from '../user-dir.service';

describe('user dir service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the stable dir key for a user id', async () => {
    vi.spyOn(UserModel, 'findByPk').mockResolvedValue({
      dataValues: {
        dir_key: 'abc123def456ghi789jkl012',
      },
    } as never);

    await expect(getUserDirKeyById('seed-user-id')).resolves.toBe('abc123def456ghi789jkl012');
  });

  it('throws when the user dir key is missing', async () => {
    vi.spyOn(UserModel, 'findByPk').mockResolvedValue(null as never);

    await expect(resolveUserDirKeyOrThrow('missing-user')).rejects.toThrow('user-dir-key-not-found');
  });
});
