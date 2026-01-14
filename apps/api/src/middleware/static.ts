import staticServe from 'koa-static';
import { PATH } from '../utils/path';
import mount from 'koa-mount';
import fs from 'fs';
import { DefaultContext, Middleware } from 'koa';

// 一些特殊文件的路径，除此之外都走前端
const staticMap = {
  // 静态资源
  '/assets': mount('/assets', staticServe(`${PATH.public}/assets`)),
  '/logo.svg': mount('/', staticServe(PATH.public)),
  // 直链
  '/file': mount('/file', staticServe(PATH.upload)),
};

// 静态文件中间件，负责返回前端需要的内容
const staticMiddleware = (): MyMiddleware => {
  return async (ctx, next) => {
    const {
      method, // 请求方法
      url, // 请求链接
    } = ctx?.request;

    if (method === 'GET' && !url.startsWith('/api')) {
      let staticWare: Middleware<{}, DefaultContext, any> | undefined;
      Object.keys(staticMap).forEach(urlItem => {
        if (url.startsWith(urlItem)) {
          staticWare = staticMap[urlItem];
        }
      });
      if (staticWare) {
        await staticWare(ctx, next);
      } else {
        //走前端路径
        ctx.type = 'html';
        ctx.body = fs.createReadStream(`${PATH.public}/index.html`);
      }
    } else {
      return await next();
    }
  };
};

export default staticMiddleware;
