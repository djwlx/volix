import path from 'path';

const ROOT = process.cwd();
const DATA = '/data';

export const PATH = {
  get root() {
    return ROOT;
  },
  get data() {
    return path.join(ROOT, DATA);
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
