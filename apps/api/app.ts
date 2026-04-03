import Koa from 'koa';
import router from './src/routes';
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import logMark from './src/middleware/log';
import config from './config';
import getGlobalInfo from './src/middleware/global-info';
import staticMiddleware from './src/middleware/static';
import initApp from './src/utils/dependencies';
import { log } from './src/utils/logger';
import { formatTime } from '@volix/utils';
import { startAnimeSyncScheduler } from './src/modules/anime-sync';

console.log(formatTime());

async function startApp() {
  // 启动前操作
  await initApp();
  startAnimeSyncScheduler();

  const app = new Koa();
  // 跨域
  app.use(cors());
  // 解析requestBody
  app.use(koaBody({ multipart: true }));
  // 记录日志
  app.use(logMark());
  //静态文件
  app.use(staticMiddleware());
  // 全局信息
  app.use(getGlobalInfo());
  // 路由
  app.use(router.routes());

  app.callback();

  app.listen(config.port, () => {
    log.info('应用启动在端口：', config.port);
    // 建议在 Server 启动后再启动调度，确保 API 已经可以处理请求
    startAnimeSyncScheduler();
    log.info('Anime Sync 调度器已就绪');
  });
}

startApp();
