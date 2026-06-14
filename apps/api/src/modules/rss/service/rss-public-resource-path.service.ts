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

export const resolvePublicRssItemResourcePath = async (params: {
  subscriptionKey: string;
  itemKey: string;
  fileName: string;
}) => {
  const userDirs = await listUserDirs();
  for (const userDir of userDirs) {
    const filePath = path.join(userDir, 'rss', 'feed', params.subscriptionKey, params.itemKey, params.fileName);
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (stat?.isFile()) {
      return {
        filePath,
        fileName: params.fileName,
      };
    }
  }
  return null;
};
