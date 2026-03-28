import { queryUser } from '../modules/user';

// 权限校验中间件，鉴权通过之后，将用户信息保存在state中方便后续操作没有权限返回401
const getGlobalInfo = (): MyMiddleware => {
  return async (ctx, next) => {
    const userId = ctx.state.userInfo?.id;
    if (!userId) {
      return next();
    }
    const userInfo = await queryUser({ id: userId });
    if (userInfo) {
      ctx.state.userInfo = {
        id: userId,
      };
    }
    next();
  };
};

export default getGlobalInfo;
