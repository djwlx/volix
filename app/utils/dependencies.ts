import { getRootPath } from './path';
import fs from 'fs';
import { syncModels } from '../models';
import jobManager from '../schedule/job-manager';

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
        console.info('生成文件夹', filePath);
        fs.mkdirSync(filePath, { recursive: true });
      }
    }
  }

  // 创建数据库
  await syncModels();

  // 启动定时任务
  jobManager.run();
};

export default initApp;
