import path from 'path';
import log4js from 'log4js';
import { getRootPath } from './path';
const { NODE_ENV } = process.env;

const isProd = NODE_ENV === 'production';

const rootPath = getRootPath();
const LOG_PATH = path.resolve(rootPath, 'logs');

log4js.configure({
  appenders: {
    console: {
      type: 'console',
    },
    normal: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      filename: path.join(`${LOG_PATH}/normal`, 'normal'), //生成文件名
    },
    database: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      filename: path.join(`${LOG_PATH}/databse`, 'database'), //生成文件名
    },
    task: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      filename: path.join(`${LOG_PATH}/task`, 'task'), //生成文件名
    },
  },
  categories: {
    prodNormal: {
      appenders: ['normal', 'console'],
      level: 'all',
    },
    devNormal: {
      appenders: ['console'],
      level: 'all',
    },
    dataBase: {
      appenders: ['database'],
      level: 'all',
    },
    taskInfo: {
      appenders: ['task'],
      level: 'all',
    },
  },
});
// 普通日志
const log = log4js.getLogger(isProd ? 'prodNormal' : 'devNormal');
// 数据库日志
const baseLog = log4js.getLogger('dataBase');
// 任务日志
const taskLog = log4js.getLogger('taskInfo');

export { log, baseLog, taskLog };
