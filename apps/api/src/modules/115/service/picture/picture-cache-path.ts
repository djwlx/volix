import path from 'path';
import { getUser115FormatDir, getUser115OriginalDir, getUser115TaskDir } from '../../../../utils/path';
import { getRequestActingUserId } from '../../../../utils/request-context';
import { buildUserDirKey } from '../../../user/service/user.service';

const normalizeUserId = (userId?: string) => String(userId || '').trim() || 'public';

export const get115UserDirKey = (userId?: string) => buildUserDirKey(normalizeUserId(userId));

export const get115OriginalCacheDir = (userId?: string) => {
  return getUser115OriginalDir(get115UserDirKey(userId || getRequestActingUserId()));
};

export const get115FormatCacheDir = (userId?: string) => {
  return getUser115FormatDir(get115UserDirKey(userId || getRequestActingUserId()));
};

export const get115TaskCacheDir = (userId?: string) => {
  return getUser115TaskDir(get115UserDirKey(userId || getRequestActingUserId()));
};

export const get115RandomMetaFilePath = (userId?: string) => {
  return path.join(get115OriginalCacheDir(userId), 'meta.random-picture.json');
};
