import Koa from 'koa';
import router from './src/route';
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import logMark from './src/middleware/log';
import config from './config';
import getGlobalInfo from './src/middleware/global-info';
import staticMiddleware from './src/middleware/static';
import initApp from './src/utils/dependencies';
import { log } from './src/utils/logger';
import { formatTime } from '@volix/utils';

console.log(formatTime());

async function startApp() {
  // 启动前操作
  await initApp();

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
  });
}

startApp();
