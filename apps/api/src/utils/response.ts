import { Context } from 'koa';

export const resSuccess = (
  ctx: Context,
  params?: {
    data?: any;
    code?: number;
    message?: string;
  }
) => {
  const { data, code, message } = params || {};
  ctx.body = {
    code: code ?? 0,
    message: message || 'success',
    data: data ?? {},
  };
};

export const resError = (
  ctx: Context,
  params: {
    data?: any;
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
