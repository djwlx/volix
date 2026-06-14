import { UserModel } from '../model/user.model';

export const getUserDirKeyById = async (userId: string | number) => {
  const row = await UserModel.findByPk(userId);
  return String(row?.dataValues?.dir_key || '').trim();
};

export const resolveUserDirKeyOrThrow = async (userId: string | number) => {
  const dirKey = await getUserDirKeyById(userId);
  if (!dirKey) {
    throw new Error('user-dir-key-not-found');
  }
  return dirKey;
};
