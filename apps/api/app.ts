import { createServer } from 'node:http';
import Koa from 'koa';
import router from './src/routes';
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import logMark from './src/middleware/log';
import config from './config';
import getGlobalInfo from './src/middleware/global-info';
import requestContextMiddleware from './src/middleware/request-context';
import staticMiddleware from './src/middleware/static';
import initApp from './src/utils/dependencies';
import { log } from './src/utils/logger';
import { formatTime } from '@volix/utils';
import { startRssFeedAutoRefreshTask } from './src/modules/rss/service/rss-auto-refresh.service';
import { sync115FileCacheDbWithFsOnStartup } from './src/modules/115/service/picture/picture-cache-startup-sync';
import { recoverAndStartFormatConvertQueue } from './src/modules/format-convert/service/format-convert-queue.service';
import { attachWebsocketServer } from './src/modules/shared/websocket/ws-server';

async function startApp() {
  log.info('应用启动时间：', formatTime());
  // 启动前操作
  await initApp();
  void sync115FileCacheDbWithFsOnStartup();
  startRssFeedAutoRefreshTask();
  void recoverAndStartFormatConvertQueue();

  const app = new Koa();
  app.on('error', error => {
    log.error('Koa 应用异常', error);
  });

  // 跨域
  app.use(cors());
  // 解析requestBody
  app.use(koaBody({ multipart: true }));
  // 请求上下文
  app.use(requestContextMiddleware());
  // 记录日志
  app.use(logMark());
  //静态文件
  app.use(staticMiddleware());
  // 全局信息
  app.use(getGlobalInfo());
  // 路由
  app.use(router.routes());

  const server = createServer(app.callback());
  attachWebsocketServer(server);

  server.on('error', error => {
    log.error('HTTP 服务异常', error);
  });

  server.listen(config.port, () => {
    log.info('应用启动在端口：', config.port);
  });
}

void startApp().catch(error => {
  log.error('应用启动失败', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理 Promise 拒绝', { reason, promise });
});

process.on('uncaughtException', (error, origin) => {
  log.error('未捕获异常', { origin, error });
});

process.on('warning', warning => {
  log.warn('进程告警', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
});
