import { PATH } from './path';
import fs from 'fs';
import { log } from './logger';
import { setLogRetentionProvider } from './log-maintenance';
import { getLogRetentionDays } from '../modules/user/service/system-setting.service';
import { ensureFormatConvertTaskSchema } from '../modules/format-convert/model/format-convert-task.model';
import { ensureRssFeedItemSchema } from '../modules/rss/model/rss-feed-item.model';
import { ensureLocalFileSchema } from '../modules/file/model/local-file.model';
import { ensureScheduledTaskSchema } from '../modules/task-center/model/scheduled-task.model';

export const getBootstrapPathList = () => [
  { filePath: PATH.data, type: 'dir' as const },
  { filePath: PATH.log, type: 'dir' as const },
  { filePath: PATH.usersRoot, type: 'dir' as const },
];

const initApp = async () => {
  // 创建必要的目录
  const pathList = getBootstrapPathList();

  for (const { filePath, type } of pathList) {
    if (type === 'dir' && !fs.existsSync(filePath)) {
      log.info(`生成文件夹 ${filePath}`);
      fs.mkdirSync(filePath, { recursive: true });
    }
  }

  setLogRetentionProvider(() => getLogRetentionDays());

  await ensureFormatConvertTaskSchema();
  await ensureRssFeedItemSchema();
  await ensureLocalFileSchema();
  await ensureScheduledTaskSchema();
};

export default initApp;
