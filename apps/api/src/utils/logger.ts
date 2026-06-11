import path from 'path';
import log4js from 'log4js';
import { PATH } from './path';
import { LOG_MAX_SIZE_BYTES, startLogMaintenance } from './log-maintenance';
const { NODE_ENV } = process.env;

const isProd = NODE_ENV === 'production';
const getNormalAppenders = () => (isProd ? ['normal', 'consoleError'] : ['console']);
const getDatabaseAppenders = () => ['database'];

log4js.configure({
  appenders: {
    console: {
      type: 'console',
    },
    consoleError: {
      type: 'logLevelFilter',
      appender: 'console',
      level: 'error',
    },
    normal: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: LOG_MAX_SIZE_BYTES,
      pattern: 'yyyy-MM-dd.log',
      filename: path.join(`${PATH.log}/normal`, 'normal'), //生成文件名
      numBackups: 5,
    },
    database: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: LOG_MAX_SIZE_BYTES,
      pattern: 'yyyy-MM-dd.log',
      filename: path.join(`${PATH.log}/databse`, 'database'), //生成文件名
      numBackups: 5,
    },
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

startLogMaintenance({
  onSuccess(result, trigger) {
    if (result.archivedFileCount > 0) {
      log.info('[log-maintenance] 归档完成', {
        trigger,
        archivedBatchCount: result.archivedBatchCount,
        archivedFileCount: result.archivedFileCount,
      });
    }
  },
  onError(error, trigger) {
    log.error('[log-maintenance] 执行失败', { trigger, error });
  },
});

export { log, baseLog };
