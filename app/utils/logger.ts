import path from 'path';
import log4js from 'log4js';
import { getRootPath } from './path';

// 对日志进行级别分类,生产环境才会记录日志
const { NODE_ENV } = process.env;

const rootPath = getRootPath();
const LOG_PATH = path.resolve(rootPath, 'logs');

log4js.configure({
  appenders: {
    info: {
      type: 'file',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      filename: path.join(LOG_PATH, 'info'), //生成文件名
    },
    error: {
      type: 'file',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      filename: path.join(LOG_PATH, 'error'),
    },
    dataBase: {
      type: 'file',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      filename: path.join(LOG_PATH, 'dataBase'),
    },
    errorFilter: {
      type: 'logLevelFilter',
      level: 'error',
      appender: 'error',
    },
    infoFilter: {
      type: 'logLevelFilter',
      level: 'info',
      appender: 'info',
    },
    consoleFilter: {
      type: 'logLevelFilter',
      level: 'error',
      appender: 'out',
    },
    out: {
      type: 'console',
    },
  },
  categories: {
    development: {
      appenders: ['out'],
      level: 'all',
    },
    production: {
      appenders: ['out'],
      level: 'all',
    },
    dataBase: {
      appenders: ['dataBase'],
      level: 'all',
    },
    default: {
      appenders: ['out'],
      level: 'all',
    },
  },
});
// 普通日志
const log = log4js.getLogger(NODE_ENV || 'development');
// 数据库日志
const baseLog = log4js.getLogger('dataBase');

export { log, baseLog };
