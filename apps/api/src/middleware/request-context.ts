import { resolveLocale } from '@volix/i18n';
import { runWithRequestContext } from '../utils/request-context';

const requestContextMiddleware = (): MyMiddleware => {
  return async (ctx, next) => {
    const userAgent = String(ctx.request.headers['user-agent'] || '').trim() || undefined;
    const locale = resolveLocale(ctx.request.headers['volix-language']);
    return runWithRequestContext(
      {
        userAgent,
        locale,
      },
      () => next()
    );
  };
};

export default requestContextMiddleware;
