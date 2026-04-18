import { runWithRequestContext } from '../utils/request-context';

const requestContextMiddleware = (): MyMiddleware => {
  return async (ctx, next) => {
    const userAgent = String(ctx.request.headers['user-agent'] || '').trim() || undefined;
    return runWithRequestContext(
      {
        userAgent,
      },
      () => next()
    );
  };
};

export default requestContextMiddleware;
