import { Context } from 'koa';
import { t } from './i18n';

export const resSuccess = (
  ctx: Context,
  params?: {
    data?: unknown;
    code?: number;
    message?: string;
  }
) => {
  const { data, code, message } = params || {};
  ctx.body = {
    code: code ?? 0,
    message: message || t({ id: 'common.message.success', defaultMessage: '成功' }),
    data: data ?? {},
  };
};

export const resError = (
  ctx: Context,
  params: {
    data?: unknown;
    code: number;
    message: string;
  }
) => {
  const { data, code, message } = params || {};
  ctx.status = code;
  ctx.body = {
    code,
    message,
    data: data ?? {},
  };
};
