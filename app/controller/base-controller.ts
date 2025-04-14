import { resError, resSuccess } from '../utils/response';

class BaseController {
  protected res(handler: MyMiddleware): MyMiddleware {
    return async (ctx, next) => {
      try {
        const result = await handler(ctx, next);
        if (result) {
          return resSuccess(ctx, {
            data: result,
          });
        }
      } catch (err) {
        resError(ctx, {
          code: 500,
          message: '服务器错误',
        });
      }
    };
  }
}

export { BaseController };
