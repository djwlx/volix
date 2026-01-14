import path from 'path';
import log4js from 'log4js';
import { PATH } from './path';
const { NODE_ENV } = process.env;

const isProd = NODE_ENV === 'production';

log4js.configure({
  appenders: {
    console: {
      type: 'console',
    },
    normal: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      pattern: 'yyyy-MM-dd.log',
      filename: path.join(`${PATH.log}/normal`, 'normal'), //生成文件名
      numBackups: 5,
    },
    database: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      pattern: 'yyyy-MM-dd.log',
      filename: path.join(`${PATH.log}/databse`, 'database'), //生成文件名
      numBackups: 5,
    },
    task: {
      type: 'dateFile',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      pattern: 'yyyy-MM-dd.log',
      filename: path.join(`${PATH.log}/task`, 'task'), //生成文件名
      numBackups: 5,
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
    default: {
      appenders: ['console'],
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
