import config from '../../../../config';
import jwt from '../../../utils/jwt';
import { pathToRegexp } from 'path-to-regexp';
import { resError } from '../../../utils/response';
import { queryUser } from '../../user';
import { UserRole } from '@volix/types';
import { setRequestContext } from '../../../utils/request-context';
import { getSystemRandomPicDefaultUserId } from '../../user/service/system-setting.service';

const GUEST_ALLOWED_PATHS = [
  '/api/115/pic',
  '/api/115/pic/parent-random',
  '/api/115/pic/cache/:pc',
  '/api/115/pic/random-cache/:cacheFileName',
];

const testRoute = (routes: string[], path: string) => {
  return routes.some(route => pathToRegexp(route).test(path));
};

export const resolve115ActingUser = (): MyMiddleware => {
  return async (ctx, next) => {
    const token = (ctx.request.header[config.token] as string) || '';
    let loginUserId = '';

    if (token) {
      try {
        const data = jwt.getData(token);
        const userInfo = await queryUser({ id: data.id as string | number });
        if (!userInfo) {
          resError(ctx, {
            code: 401,
            message: '用户不存在',
          });
          return;
        }
        loginUserId = String(userInfo.dataValues.id || '');
        ctx.state.userInfo = {
          id: loginUserId,
          email: userInfo.dataValues.email,
          nickname: userInfo.dataValues.nickname,
          avatar: userInfo.dataValues.avatar,
          role: (userInfo.dataValues.role || UserRole.USER) as UserRole,
        };
      } catch {
        resError(ctx, {
          code: 401,
          message: '权限认证错误',
        });
        return;
      }
    }

    if (loginUserId) {
      setRequestContext({
        actingUserId: loginUserId,
      });
      await next();
      return;
    }

    const isGuestPath = testRoute(GUEST_ALLOWED_PATHS, ctx.path);
    if (!isGuestPath) {
      resError(ctx, {
        code: 401,
        message: '未进行权限认证',
      });
      return;
    }

    const defaultUserId = await getSystemRandomPicDefaultUserId();
    if (!defaultUserId) {
      resError(ctx, {
        code: 400,
        message: '系统未配置随机图默认用户',
      });
      return;
    }

    const user = await queryUser({ id: defaultUserId });
    if (!user) {
      resError(ctx, {
        code: 400,
        message: '随机图默认用户不存在',
      });
      return;
    }

    setRequestContext({
      actingUserId: String(user.dataValues.id || ''),
    });

    await next();
  };
};
