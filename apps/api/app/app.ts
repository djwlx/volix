import Koa from 'koa';
import router from './route';
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import logMark from './middleware/log';
import authenticate from './middleware/authenticate';
import config from '../config';
import getGlobalInfo from './middleware/global-info';
import staticMiddleware from './middleware/static';
import initApp from './utils/dependencies';
import { log } from './utils/logger';

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

  // 路由鉴权;
  // app.use(
  //   authenticate({
  //     notInclude: ['/api/user/register', '/api/user/login', '/api/util/:any', '/api/util', '/api/file/:any'],
  //   })
  // );

  // 全局信息
  app.use(getGlobalInfo());
  // 路由
  app.use(router.routes());

  app.listen(config.port, () => {
    log.info('应用启动在端口：', config.port);
  });
}

startApp();
