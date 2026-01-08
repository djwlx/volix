import { log } from '../utils/logger';
import { resError, resSuccess } from '../utils/response';

class BaseController {
  protected res(handler: MyMiddleware): MyMiddleware {
    return async (ctx, next) => {
      try {
        const result = await handler(ctx, next);
        if (result !== undefined) {
          return resSuccess(ctx, {
            data: result,
          });
        }
      } catch (err) {
        log.error(err);
        resError(ctx, {
          code: 500,
          message: '服务器错误',
        });
      }
    };
  }
}

export { BaseController };
