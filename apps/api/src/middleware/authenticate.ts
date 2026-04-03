import JWT from '../utils/jwt';
import config from '../../config/index';
import { pathToRegexp } from 'path-to-regexp';
import { resError } from '../utils/response';
import { queryUser } from '../modules/user';
import { UserRole } from '@volix/types';

interface AuthenticateParam {
  include?: string[];
  notInclude?: string[];
}

const testArray = (array: string[], key: string) => {
  return array.some(item => {
    const regexpTemp = pathToRegexp(item);

    return regexpTemp.test(key);
  });
};

// 权限校验中间件，鉴权通过之后，将用户信息保存在state中方便后续操作没有权限返回401
const authenticate = (option?: AuthenticateParam): MyMiddleware => {
  return async (ctx, next) => {
    // 自定义token放在header中，所以从header中去取，也可以放在其他地方
    const { header, url } = ctx.request;
    const { include = [], notInclude = [] } = option || {};

    // 控制哪些路由不进行权限校验
    if (testArray(notInclude, url) && !testArray(include, url)) {
      await next();
      return;
    }

    // 权限校验
    const token = header[config.token] as string;

    if (!token) {
      resError(ctx, {
        code: 401,
        message: '未进行权限认证',
      });
    } else {
      // 认证成功后可以从数据库中取出用户信息放到ctx的state中,只捕获认证错误
      try {
        const data = JWT.getData(token);
        const { id } = data;
        const userInfo = await queryUser({ id: id as string | number });
        if (!userInfo) {
          resError(ctx, {
            code: 401,
            message: '用户不存在',
          });
          return;
        }
        if (userInfo.dataValues.id === undefined || userInfo.dataValues.id === null || !userInfo.dataValues.email) {
          resError(ctx, {
            code: 401,
            message: '用户信息异常',
          });
          return;
        }
        ctx.state.userInfo = {
          id: userInfo.dataValues.id,
          email: userInfo.dataValues.email,
          nickname: userInfo.dataValues.nickname,
          avatar: userInfo.dataValues.avatar,
          role: (userInfo.dataValues.role || UserRole.USER) as UserRole,
          roleKey: userInfo.dataValues.role_key,
        };
        await next();
      } catch (e) {
        resError(ctx, {
          code: 401,
          message: '权限认证错误',
        });
      }
    }
  };
};

export default authenticate;
