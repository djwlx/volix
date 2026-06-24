import path from 'path';
import { format } from 'node:util';
import log4js from 'log4js';
import { formatTime } from '@volix/utils';
import { PATH } from './path';
import { startLogMaintenance } from './log-maintenance';
const { NODE_ENV } = process.env;

const isProd = NODE_ENV === 'production';
const getNormalAppenders = () => (isProd ? ['normal'] : ['normal', 'console']);
const getDatabaseAppenders = () => ['database'];
const getTaskAppenders = () => (isProd ? ['task'] : ['task', 'console']);

const LOCAL_TIME_LAYOUT = { type: 'localTime' } as const;

export const createDateFileAppender = (filename: string) => ({
  type: 'dateFile' as const,
  alwaysIncludePattern: true,
  pattern: 'yyyy-MM-dd.log',
  filename,
  layout: LOCAL_TIME_LAYOUT,
});

log4js.addLayout('localTime', () => logEvent => {
  const time = formatTime(logEvent.startTime);
  const level = logEvent.level.levelStr;
  const message = format(...logEvent.data);
  return `[${time}] [${level}] ${logEvent.categoryName} - ${message}`;
});

log4js.configure({
  appenders: {
    console: {
      type: 'console',
      layout: LOCAL_TIME_LAYOUT,
    },
    normal: createDateFileAppender(path.join(`${PATH.log}/normal`, 'normal')),
    database: createDateFileAppender(path.join(`${PATH.log}/databse`, 'database')),
    task: createDateFileAppender(path.join(`${PATH.log}/task`, 'task')),
  },
  categories: {
    normal: {
      appenders: getNormalAppenders(),
      level: 'all',
    },
    dataBase: {
      appenders: getDatabaseAppenders(),
      level: 'all',
    },
    task: {
      appenders: getTaskAppenders(),
      level: 'all',
    },
    default: {
      appenders: getNormalAppenders(),
      level: 'all',
    },
  },
});
// 普通日志
const log = log4js.getLogger('normal');
// 数据库日志
const baseLog = log4js.getLogger('dataBase');
// 任务日志
const taskLog = log4js.getLogger('task');

startLogMaintenance({
  onSuccess(result, trigger) {
    if (result.deletedFileCount > 0 || result.removedArchiveDirCount > 0) {
      log.info('[log-maintenance] 清理完成', {
        trigger,
        deletedFileCount: result.deletedFileCount,
        removedArchiveDirCount: result.removedArchiveDirCount,
      });
    }
  },
  onError(error, trigger) {
    log.error('[log-maintenance] 执行失败', { trigger, error });
  },
});

export { log, baseLog, taskLog };
