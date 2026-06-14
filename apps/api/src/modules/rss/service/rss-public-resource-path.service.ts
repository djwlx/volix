import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';

const listUserDirs = async () => {
  try {
    const entries = await fs.promises.readdir(PATH.usersRoot, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => path.join(PATH.usersRoot, entry.name));
  } catch {
    return [] as string[];
  }
};

export const getPublicRssResourceProxyDirList = async () => {
  const userDirs = await listUserDirs();
  return userDirs.map(userDir => path.join(userDir, 'rss', 'cache', 'resource-proxy'));
};
