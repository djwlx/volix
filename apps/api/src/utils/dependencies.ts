import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';

const initApp = async () => {
  // 创建必要的目录
  const pathList = [
    { filePath: PATH.log, type: 'dir' },
    { filePath: PATH.upload, type: 'dir' },
  ];

  for (const { filePath, type } of pathList) {
    if (type === 'dir' && !fs.existsSync(filePath)) {
      log.info(`生成文件夹 ${filePath}`);
      fs.mkdirSync(filePath, { recursive: true });
    }
  }
};

export default initApp;
