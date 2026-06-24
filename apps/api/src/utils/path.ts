import fs from 'fs';
import path from 'path';

const resolveAppRoot = () => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'app.js')) || fs.existsSync(path.join(cwd, 'app.ts'))) {
    return cwd;
  }

  const candidate = path.resolve(__dirname, '../..');
  return path.basename(candidate) === 'dist' ? path.resolve(candidate, '..') : candidate;
};

const ROOT = resolveAppRoot();
const DATA = '/data';
const DIR_KEY_REGEXP = /^[a-z0-9_-]+$/;

const sanitizeDirKey = (dirKey: string) => {
  const normalized = String(dirKey || '')
    .trim()
    .toLowerCase();
  if (!DIR_KEY_REGEXP.test(normalized)) {
    throw new Error(`invalid-user-dir-key:${dirKey}`);
  }
  return normalized;
};

export const PATH = {
  get root() {
    return ROOT;
  },
  get data() {
    return path.join(ROOT, DATA);
  },
  get cache() {
    return path.join(ROOT, DATA, 'cache');
  },
  get cacheMedia() {
    return path.join(ROOT, DATA, 'cache', 'media');
  },
  get cacheMediaFormatConvert() {
    return path.join(ROOT, DATA, 'cache', 'media', 'format-convert');
  },
  get log() {
    return path.join(ROOT, DATA, 'log');
  },
  get database() {
    return path.join(ROOT, DATA, 'index.db');
  },
  get usersRoot() {
    return path.join(ROOT, DATA, 'users');
  },
  get public() {
    return path.join(ROOT, 'public');
  },
};

export const getUserRootDir = (dirKey: string) => path.join(PATH.usersRoot, sanitizeDirKey(dirKey));
export const getUserUploadDir = (dirKey: string) => path.join(getUserRootDir(dirKey), 'upload');
export const getUserManualUploadDir = (dirKey: string) => path.join(getUserUploadDir(dirKey), 'manual');
export const getUserCloudUploadDir = (dirKey: string) => path.join(getUserUploadDir(dirKey), 'cloud');
export const getUserFormatRootDir = (dirKey: string) => path.join(getUserUploadDir(dirKey), 'format');
export const getUserFormatResultRootDir = (dirKey: string) => path.join(getUserFormatRootDir(dirKey), 'results');
export const getUserFormatResultDir = (dirKey: string, taskId: string | number) =>
  path.join(getUserFormatResultRootDir(dirKey), String(taskId));
export const getUserFormatTaskDir = (dirKey: string, taskId: string | number) =>
  path.join(getUserFormatRootDir(dirKey), '.tasks', String(taskId));
export const getUser115RootDir = (dirKey: string) => path.join(getUserRootDir(dirKey), '115-files');
export const getUser115OriginalDir = (dirKey: string) => path.join(getUser115RootDir(dirKey), 'original');
export const getUser115FormatDir = (dirKey: string) => path.join(getUser115RootDir(dirKey), 'format');
export const getUser115TaskDir = (dirKey: string) => path.join(getUser115RootDir(dirKey), '.tasks');
export const getUserRssRootDir = (dirKey: string) => path.join(getUserRootDir(dirKey), 'rss');
export const getUserRssFeedDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), 'feed');
export const getUserRssHistoryDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), 'history');
export const getUserRssCacheDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), 'cache');
export const getUserRssTaskDir = (dirKey: string) => path.join(getUserRssRootDir(dirKey), '.tasks');
