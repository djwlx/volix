import { log } from '../../utils/logger';
import { resError, resSuccess } from '../../utils/response';

export class HttpError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export const badRequest = (message: string, data?: unknown): never => {
  throw new HttpError(400, message, data);
};

export const unauthorized = (message: string, data?: unknown): never => {
  throw new HttpError(401, message, data);
};

export const http = (handler: MyMiddleware): MyMiddleware => {
  return async (ctx, next) => {
    try {
      const result = await handler(ctx, next);
      if (result !== undefined) {
        resSuccess(ctx, {
          data: result,
        });
      }
    } catch (err) {
      if (err instanceof HttpError) {
        resError(ctx, {
          code: err.status,
          message: err.message,
          data: err.data,
        });
        return;
      }

      log.error(err);
      resError(ctx, {
        code: 500,
        message: '服务器错误',
      });
    }
  };
};
