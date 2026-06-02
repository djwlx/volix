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
  get log() {
    return path.join(ROOT, DATA, 'log');
  },
  get database() {
    return path.join(ROOT, DATA, 'index.db');
  },
  get upload() {
    return path.join(ROOT, DATA, 'upload');
  },
  get public() {
    return path.join(ROOT, 'public');
  },
};
