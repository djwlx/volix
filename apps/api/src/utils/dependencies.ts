import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';

const initApp = async () => {
  // // 生成必要的文件夹
  const pathList = [
    {
      filePath: PATH.log,
      type: 'dir',
    },
    {
      filePath: PATH.upload,
      type: 'dir',
    },
  ];

  for (const pathItem of pathList) {
    const { filePath, type } = pathItem;
    if (type === 'dir') {
      if (!fs.existsSync(filePath)) {
        log.info(`生成文件夹 ${filePath}`);
        fs.mkdirSync(filePath, { recursive: true });
      }
    }
  }
};

export default initApp;
