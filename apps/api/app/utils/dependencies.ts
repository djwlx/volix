import { getRootPath } from './path';
import fs from 'fs';
// import { initSchedule } from '../schedule';
import { log } from './logger';

const initApp = async () => {
  const rootPath = getRootPath();

  // // 生成必要的文件夹
  const pathList = [
    {
      filePath: `${rootPath}/logs`,
      type: 'dir',
    },
    {
      filePath: `${rootPath}/uploads`,
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

  // 启动定时任务
  // initSchedule();
};

export default initApp;
