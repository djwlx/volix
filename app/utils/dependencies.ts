import { getRootPath } from './path';
import fs from 'fs';
import '../schedule';
import jobManager from '../schedule/job-manager';

const initApp = async () => {
  const rootPath = getRootPath();

  // 生成必要的文件夹和文件
  const fileDirList = [`${rootPath}/uploads`];
  const fileList = [`${rootPath}/app/database/index.db`];

  fileList.forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '');
    }
  });

  fileDirList.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
};

export default initApp;
