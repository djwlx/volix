import { log } from '../utils/logger';

// 日志记录中间件,根据环境去判断
const logMrak = (): MyMiddleware => {
  return async (ctx, next) => {
    const startTime = Date.now();
    const {
      method, // 请求方法
      url, // 请求链接
      body, // 请求数据
      query, // 路径参数
    } = ctx?.request;

    const stringQuery = JSON.stringify(query);
    // 记录应用中的错误
    try {
      await next();
    } catch (err) {
      log.error(err);
    }

    const endTime = Date.now();
    const { status } = ctx.response;
    const time = endTime - startTime + 'ms';
    log.info(method, status, url, 'body:', body, 'query:', stringQuery, '请求耗时:', time);
  };
};

export default logMrak;
